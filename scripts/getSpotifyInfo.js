/**
 * Spotify Search API reference:
 * https://developer.spotify.com/documentation/web-api/reference/search
 *
 * Spotify app credentials documentation:
 * https://developer.spotify.com/documentation/web-api/concepts/apps
 *
 * This script uses the Spotify Web API Search endpoint and requires
 * Client_ID (or CLIENT_ID) and CLIENT_SECRET from the local .env file.
 */

import { readFile, writeFile } from "node:fs/promises";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const dataPath = path.join(projectRoot, "public", "data.json");
const outputPath = path.join(projectRoot, "public", "replaced-spotify.json");
const REQUEST_DELAY_MS = 2000;

dotenv.config({ path: envPath });

/**
 * Reads Spotify API credentials from environment variables.
 * Supports both `Client_ID` and `CLIENT_ID` for compatibility.
 *
 * @returns {{ clientId: string, clientSecret: string }} Spotify credentials.
 */
function getSpotifyCredentials() {
    const clientId = process.env.Client_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    console.log("[Spotify Credentials] Loaded credential configuration from .env", {
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
        envPath
    });

    if (!clientId || !clientSecret) {
        throw new Error(`Missing Spotify credentials in ${envPath}. Please set Client_ID (or CLIENT_ID) and CLIENT_SECRET.`);
    }

    return { clientId, clientSecret };
}

/**
 * Requests an application access token from Spotify.
 *
 * @param {string} clientId Spotify client ID.
 * @param {string} clientSecret Spotify client secret.
 * @returns {Promise<string>} Spotify access token.
 */
async function getSpotifyToken(clientId, clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    console.log("[Spotify Token Request] Requesting access token", {
        tokenUrl: "https://accounts.spotify.com/api/token",
        grantType: "client_credentials",
        clientIdPreview: `${clientId.slice(0, 6)}...`
    });

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "client_credentials"
        })
    });

    if (!res.ok) {
        throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    console.log("[Spotify Token Response] Access token received", {
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        hasAccessToken: Boolean(data.access_token)
    });
    return data.access_token;
}

/**
 * Searches Spotify album results by artist and album name.
 *
 * @param {string} accessToken Spotify access token.
 * @param {string} artist Artist name from the entry.
 * @param {string} album Album name from the entry.
 * @returns {Promise<Array<{name: string, artists: string, url: string | null, id: string}> | null>} Album candidates.
 */
async function searchAlbumUrl(accessToken, artist, album) {
    const q = `artist:"${artist}" album:"${album}"`;
    const url = `https://api.spotify.com/v1/search?${new URLSearchParams({
        q,
        type: "album",
        limit: "5"
    }).toString()}`;

    console.log("[Spotify Search Request] Sending search request", {
        artist,
        album,
        query: q,
        requestUrl: url,
        limit: 5,
        type: "album"
    });

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!res.ok) {
        throw new Error(`Search failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const items = data?.albums?.items ?? [];

    console.log("[Spotify Search Response] Search completed", {
        artist,
        album,
        resultCount: items.length,
        results: items.map((item) => ({
            name: item.name,
            artists: (item.artists || []).map((a) => a.name).join(", "),
            url: item.external_urls?.spotify || null,
            id: item.id
        }))
    });

    if (!items.length) {
        return null;
    }

    return items.map((item) => ({
        name: item.name,
        artists: (item.artists || []).map((a) => a.name).join(", "),
        url: item.external_urls?.spotify || null,
        id: item.id
    }));
}

/**
 * Reads the source JSON file and returns its parsed content.
 *
 * @returns {Promise<{entries: Array<object>}>} Parsed source data.
 */
async function readSourceData() {
    const content = await readFile(dataPath, "utf8");
    const parsed = JSON.parse(content);

    console.log("[Source Data] Loaded source JSON", {
        dataPath,
        entryCount: Array.isArray(parsed?.entries) ? parsed.entries.length : 0
    });

    return parsed;
}

/**
 * Delays the next request to avoid concurrent or aggressive API usage.
 *
 * @param {number} ms Delay duration in milliseconds.
 * @returns {Promise<void>} Promise resolved after the delay.
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Resolves the replacement Spotify URL for a single entry.
 * Keeps the original value when no result is found.
 *
 * @param {string} accessToken Spotify access token.
 * @param {object} entry Entry object from `public/data.json`.
 * @returns {Promise<object>} Updated entry object.
 */
async function replaceSpotifyForEntry(accessToken, entry) {
    const artist = entry?.artist?.trim();
    const album = entry?.album?.trim();
    const currentSpotify = entry?.spotify?.trim();

    console.log("[Entry Processing] Processing entry", {
        date: entry?.date || null,
        artist,
        album,
        currentSpotify: currentSpotify || null
    });

    if (currentSpotify) {
        console.log("[Entry Processing] Existing Spotify URL detected, skipping search request", {
            date: entry?.date || null,
            artist,
            album,
            currentSpotify
        });
        return { ...entry };
    }

    if (!artist || !album) {
        console.log("[Entry Processing] Skipped entry because artist or album is missing", {
            date: entry?.date || null,
            artist,
            album
        });
        return { ...entry };
    }

    const results = await searchAlbumUrl(accessToken, artist, album);
    const replacementUrl = results?.find((item) => item.url)?.url;

    if (!replacementUrl) {
        console.log("[Entry Processing] No Spotify replacement found, keeping original value", {
            date: entry?.date || null,
            artist,
            album,
            originalSpotify: currentSpotify || null
        });
        return { ...entry };
    }

    console.log("[Entry Processing] Spotify URL replaced", {
        date: entry?.date || null,
        artist,
        album,
        originalSpotify: currentSpotify || null,
        replacementSpotify: replacementUrl
    });

    return {
        ...entry,
        spotify: replacementUrl
    };
}

/**
 * Processes all entries sequentially, waits two seconds between requests,
 * and writes the transformed result to `public/replaced-spotify.json`.
 *
 * @returns {Promise<void>} Completion promise.
 */
async function getSpotifyInfo() {
    const sourceData = await readSourceData();
    const entries = Array.isArray(sourceData?.entries) ? sourceData.entries : [];
    const { clientId, clientSecret } = getSpotifyCredentials();
    const accessToken = await getSpotifyToken(clientId, clientSecret);
    const replacedEntries = [];

    console.log("[Progress] Starting Spotify replacement process", {
        totalEntries: entries.length,
        requestDelayMs: REQUEST_DELAY_MS,
        outputPath
    });

    for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        console.log(`[Progress] Processing ${index + 1}/${entries.length}`, {
            date: entry?.date || null,
            artist: entry?.artist || null,
            album: entry?.album || null
        });
        const updatedEntry = await replaceSpotifyForEntry(accessToken, entry);
        replacedEntries.push(updatedEntry);

        if (index < entries.length - 1) {
            console.log(`[Progress] Waiting ${REQUEST_DELAY_MS}ms before next request`, {
                completed: index + 1,
                remaining: entries.length - index - 1
            });
            await sleep(REQUEST_DELAY_MS);
        }
    }

    const outputData = {
        ...sourceData,
        entries: replacedEntries
    };

    await writeFile(outputPath, `${JSON.stringify(outputData, null, 2)}\n`, "utf8");

    console.log("[Progress] Spotify replacement process completed", {
        totalEntries: replacedEntries.length,
        outputPath
    });
}

getSpotifyInfo().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
