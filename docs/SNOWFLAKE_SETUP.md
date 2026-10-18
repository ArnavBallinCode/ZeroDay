# Snowflake setup — no secret keys required

DataMind's local development path uses Snowflake's `externalbrowser` authenticator. The Python
connector opens Snowflake's own sign-in flow and receives a temporary authenticated session. Do not
create or share an API key, password, OAuth token, or private key for this workflow.

Official references:

- [Find the account identifier](https://docs.snowflake.com/en/user-guide/admin-account-identifier)
- [Python connector authentication](https://docs.snowflake.com/en/developer-guide/python-connector/python-connector-api)
- [Snowflake sample data](https://docs.snowflake.com/en/user-guide/sample-data-using)

## 1. Get the two non-secret connection values

Sign in to Snowsight and open the account selector, then **View account details**. Copy the account
identifier intended for connectors. It normally has the form `organization-account`; do not include
`https://` or `.snowflakecomputing.com`.

In a Snowsight worksheet, run:

```sql
SELECT
  CURRENT_ORGANIZATION_NAME() || '-' || CURRENT_ACCOUNT_NAME() AS ACCOUNT_IDENTIFIER,
  CURRENT_USER() AS USERNAME;
```

These are identifiers, not credentials. Put them in the local `.env` file:

```dotenv
SNOWFLAKE_ACCOUNT=organization-account
SNOWFLAKE_USER=your_username
SNOWFLAKE_AUTHENTICATOR=externalbrowser
```

## 2. Create the least-privilege demo resources

Open `scripts/setup_snowflake.sql` in a Snowsight worksheet. Replace `YOUR_USERNAME` in the last
statement, uncomment it, and run the worksheet. It creates:

- `DATAMIND_WH`, an X-Small warehouse with 60-second auto-suspend;
- `DATAMIND_READER`, a role that can use that warehouse and read Snowflake's sample database.

If `SNOWFLAKE_SAMPLE_DATA` is not present, run this first as `ACCOUNTADMIN`:

```sql
CREATE DATABASE SNOWFLAKE_SAMPLE_DATA FROM SHARE SFC_SAMPLES.SAMPLE_DATA;
```

The sample database is read-only and is not copied into this repository.

## 3. Verify the real connection

From the repository root:

```bash
cp .env.example .env  # only if .env does not already exist
uv sync --extra dev --python 3.13
uv run datamind doctor
```

Your browser will open Snowflake's login page. Complete that login yourself. A successful check prints
a real Snowflake query ID, warehouse, role, and TPC-H order count without printing credentials.

Then run the full path:

```bash
uv run datamind smoke
```

## 4. Start the application

Terminal 1:

```bash
uv run uvicorn datamind.api:app --reload --port 8000
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Optional automation authentication

Key-pair, OAuth, programmatic access tokens, or workload identity can be added later for unattended
CI. They are intentionally out of scope for the interactive hackathon demo because they introduce
long-lived secret management without improving judging evidence. Never commit such credentials.
