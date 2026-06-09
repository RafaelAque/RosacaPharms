# ROSACA FARMS Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Paste and run the contents of `supabase-schema.sql`.
4. Go to Project Settings > API.
5. Copy your Project URL and anon public key.
6. Open `supabase-config.js` and fill in:

```js
window.ROSACA_SUPABASE = {
  url: "https://your-project.supabase.co",
  anonKey: "your-anon-public-key"
};
```

7. Open `index.html` in a browser.

When Supabase is connected, the dashboard status will say `Supabase connected`. If the keys are blank or Supabase cannot be reached, the prototype will show a connection warning and will not save records locally.
