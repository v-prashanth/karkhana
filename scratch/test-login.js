const testLogin = async () => {
  try {
    const res = await fetch("http://localhost:3000/api/auth/email/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "myselfai@outlook.com", password: "Karkhana123!@#Secure" })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
};
testLogin();
