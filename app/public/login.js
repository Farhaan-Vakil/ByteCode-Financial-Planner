document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",  
    body: JSON.stringify({ email, password })
  });

  if (res.status === 200) {
    window.location.href = "dashboard.html";  
  }

});