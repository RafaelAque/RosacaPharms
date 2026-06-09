# ROSACA FARMS System User Manual

## System Title

Web-Based Palm Fruit Harvest Monitoring and Invoice Management System for ROSACA FARMS

## System Overview

The ROSACA FARMS system is a web-based prototype designed to help farm personnel record, monitor, search, and report palm fruit harvest and invoice information. The system replaces manual paper-based recording with a digital interface connected to Supabase for online database storage.

The system supports harvest recording, invoice management, harvest quality monitoring, record search and retrieval, dashboard analytics, and report generation.

## User Roles

The system has two user roles:

| Role | Access |
| --- | --- |
| Farm Staff | Can record harvest information, record invoice details, search records, and view dashboard summaries. |
| Farm Manager | Can access all Farm Staff functions plus quality monitoring and report generation. |

## Demo Accounts

Use these accounts to access the prototype:

| Role | Username | Password |
| --- | --- | --- |
| Farm Manager | `manager` | `rosaca123` |
| Farm Staff | `staff` | `rosaca123` |

## How to Run the System Locally

1. Open the project folder:

```text
C:\Users\Rafael Luis\Documents\Rosaca Pharms
```

2. Right-click `index.html`.
3. Select **Open with**.
4. Choose a browser such as Google Chrome or Microsoft Edge.
5. Log in using one of the demo accounts.

## Supabase Database Setup

Before using the system with live data, Supabase must be configured.

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Open the file `supabase-schema.sql` from the project folder.
4. Copy all SQL code from the file.
5. Paste it into the Supabase SQL Editor.
6. Click **Run**.

This creates the required database tables:

- `harvest_records`
- `invoice_records`

It also enables Row Level Security and creates prototype read, insert, and update policies.

## Supabase Configuration

1. In Supabase, go to **Project Settings > API**.
2. Copy the **Project URL**.
3. Copy the **Publishable key**.
4. Open `supabase-config.js`.
5. Paste the values in this format:

```js
window.ROSACA_SUPABASE = {
  url: "https://your-project.supabase.co",
  anonKey: "your-publishable-key"
};
```

The system will only load and save records through Supabase. If Supabase is not configured correctly, the system displays a connection warning.

## Login Procedure

1. Open the system in a browser.
2. Select the user role.
3. Enter the username.
4. Enter the password.
5. Click **Sign in**.

After successful login, the dashboard will appear.

## Dashboard

The dashboard shows a summary of farm operations:

- Total harvest recorded
- Total deliveries
- Total rejected quantities
- Average harvest quality
- Harvest quality summary
- Recent invoices

The dashboard data comes from Supabase records.

## Harvest Recording

Use this module to record daily harvest information.

Steps:

1. Click **Harvest Recording**.
2. The Transaction No. is generated automatically.
3. Enter the harvest date.
4. Enter the batch information.
5. Enter the harvest weight in kilograms.
6. Enter the delivery date.
7. Add remarks if needed.
8. Click **Save harvest record**.

Example:

| Field | Example |
| --- | --- |
| Transaction No. | Auto-generated |
| Harvest Date | `06/09/2026` |
| Batch Information | `Batch D - North Field` |
| Harvest Weight | `1950` |
| Delivery Date | `06/10/2026` |
| Remarks | `Delivered to processing plant for grading` |

When saved, the record is inserted into the Supabase `harvest_records` table.

To edit a harvest record:

1. Click **Edit** beside the harvest record.
2. Update the harvest date, batch information, weight, delivery date, or remarks.
3. Click **Update harvest record**.
4. The changes are saved to Supabase.

To download harvest records:

1. Click **Download CSV** in the Harvest Records panel.
2. The system downloads the current harvest records as `rosaca-harvest-records.csv`.

## Invoice Management

Use this module to record invoice details received from the processing plant.

Steps:

1. Click **Invoices**.
2. The Invoice No. is generated automatically.
3. Enter the delivery date.
4. Enter the harvest weight in kilograms.
5. Enter the rejected quantity in kilograms.
6. Select the quality grade.
7. Enter the payment amount.
8. Click **Save invoice**.

Example:

| Field | Example |
| --- | --- |
| Invoice No. | Auto-generated |
| Delivery Date | `06/10/2026` |
| Harvest Weight | `1950` |
| Rejected Quantity | `85` |
| Quality Grade | `A` |
| Payment Amount | `78000` |

When saved, the record is inserted into the Supabase `invoice_records` table.

To edit an invoice record:

1. Click **Edit** beside the invoice record.
2. Update the delivery date, weight, rejected quantity, quality grade, or payment amount.
3. Click **Update invoice**.
4. The changes are saved to Supabase.

To download invoice records:

1. Click **Download CSV** in the Invoice History panel.
2. The system downloads the current invoice records as `rosaca-invoice-records.csv`.

## Harvest Quality Monitoring

This module is available to the Farm Manager.

It displays:

- Rejected harvest analysis by delivery date
- Quality grade distribution
- Rejected quantity trends

The purpose of this module is to help the farm monitor harvest quality and identify rejected harvest patterns.

## Search and Retrieval

Use this module to quickly find harvest and invoice records.

Steps:

1. Click **Search**.
2. Type a keyword into the search box.
3. Search by transaction number, invoice number, batch, date, quality grade, or remarks.
4. Matching records appear instantly.

## Report Generation

This module is available to the Farm Manager.

Available report views:

- Harvest Report
- Invoice Summary Report
- Harvest Quality Report
- Delivery Report

Steps:

1. Click **Reports**.
2. Select a report type.
3. Review the generated report.
4. Click **Print preview** if a printed copy is needed.

## GitHub Deployment

The project files can be uploaded to GitHub as a static website project.

Required files:

- `index.html`
- `styles.css`
- `app.js`
- `supabase-config.js`
- `supabase-schema.sql`
- `SUPABASE_SETUP.md`
- `README.md`

## Vercel Deployment

To deploy the system online:

1. Go to Vercel.
2. Sign in with GitHub.
3. Import the GitHub repository.
4. Use the default static project settings.
5. Click **Deploy**.

After deployment, Vercel provides a public website link.

## Important Notes

- The Supabase publishable key is safe for browser use.
- Do not use or upload the Supabase `service_role` key.
- The current login is prototype authentication for demonstration purposes.
- For production use, Supabase Auth should be implemented.
- Records are saved in Supabase only after the schema and configuration are completed.

## Main Files

| File | Purpose |
| --- | --- |
| `index.html` | Main system interface |
| `styles.css` | Layout, styling, and animations |
| `app.js` | System logic, auto-numbering, editing, CSV downloads, Supabase connection, reports, and role access |
| `supabase-config.js` | Supabase URL and publishable key |
| `supabase-schema.sql` | Database table setup and policies |
| `SUPABASE_SETUP.md` | Short Supabase setup guide |
| `README.md` | User manual |
