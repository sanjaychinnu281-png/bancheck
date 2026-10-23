# CHINNU Free Fire API (Vercel)

A small Python API scaffold with separate player-info and ban-status endpoints.

## Endpoints
- `GET /` — health and endpoint list
- `GET /api/player?uid=123456789&region=IND` — proxies to the configured player-info provider
- `GET /api/ban?uid=123456789&region=IND` — proxies to a configured ban provider

## Important provider notes
The original `guest-level-checker.py` uses account login credentials and inspects a game login response. It is not a public UID-only API, and it cannot safely establish a ban status from a failed login alone.

The player endpoint defaults to `https://free-fire-info-ob55.vercel.app/player-info`, based on the endpoint you previously shared. The exact parameter names and response schema are controlled by that upstream service. If it expects different parameter names, set `FF_PLAYER_INFO_URL` to a compatible endpoint or adjust `api/player.py`.

No ban provider is bundled because no verified UID-only ban endpoint was supplied. Until configured, `/api/ban` returns HTTP 501 with `status: unknown`; it does not invent a result.

## Deploy from an Android phone
1. Download and unzip this project.
2. In GitHub, create a new repository named `chinnu-free-fire-api`.
3. Upload all project files, keeping the `api` folder and its three Python files.
4. Sign in to Vercel and choose **Add New → Project**.
5. Import the GitHub repository.
6. Leave the framework preset as **Other**. Vercel detects Python functions in the root `api` directory.
7. Deploy.
8. Open the deployed URL. It should return JSON showing the API status.
9. Test `/api/player?uid=18504769039&region=IND`.
10. Test `/api/ban?uid=18504769039&region=IND`. It will return `ban_provider_not_configured` until you have a reliable provider.

## Environment variables (optional)
In Vercel → Project → Settings → Environment Variables:
- `FF_PLAYER_INFO_URL`: HTTPS URL for a compatible player-info provider. If omitted, the default endpoint above is used.
- `FF_BAN_STATUS_URL`: HTTPS URL for a reliable ban-status provider. It must accept `uid` and `region` query parameters and return JSON.

After adding/changing variables, redeploy the project.

## Response interpretation
- `200`: upstream returned JSON; inspect `data` because its field names come from the provider.
- `400`: invalid UID or region.
- `501`: no ban provider configured.
- `502`: provider failure or invalid upstream response.

## Limitations
- Vercel Python functions have execution-time limits; this is intended for single lookups, not bulk checking.
- Region labels are validated inputs, not proof that the upstream supports every region.
- The API does not request, store, or expose game-account passwords.
