async function testOAuth() {
  const url = "https://together-beryl-six.vercel.app/api/auth/sign-in/social";
  const payload = {
    provider: "google",
    callbackURL: "https://together-beryl-six.vercel.app/dashboard",
    errorCallbackURL: "https://together-beryl-six.vercel.app/login?error=oauth"
  };

  console.log("Sending POST to:", url);
  console.log("Payload:", payload);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Raw Response:");
    console.log(text);
    
    try {
      const json = JSON.parse(text);
      console.log("\nParsed JSON:", json);
    } catch {
      console.log("\nResponse is not JSON.");
    }
  } catch (err) {
    console.error("Fetch Exception:", err);
  }
}

testOAuth();
