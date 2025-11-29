// Authentication utility for frontend
const Auth = {
  async checkAuth() {
    try {
      const res = await fetch("/api/user", {
        credentials: "include",
      });
      const data = await res.json();
      return data.authenticated ? data.user : null;
    } catch (error) {
      console.error("Auth check error:", error);
      return null;
    }
  },

  async logout() {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/login.html";
      }
      return data;
    } catch (error) {
      console.error("Logout error:", error);
      alert("خطا در خروج از سیستم.");
    }
  },

  async updateNavButtons() {
    const user = await this.checkAuth();
    const navButtons = document.querySelector(".nav-buttons");
    
    if (!navButtons) return;

    if (user) {
      // User is logged in - show logout button
      navButtons.innerHTML = `
        <a href="chat.html" class="btn-auth">پشتیبانی</a>
        <span class="btn-auth" style="cursor: default; background-color: #4a5568; color: white;">${user.username}</span>
        <button onclick="Auth.logout()" class="btn-auth" style="border: none; font-size: 1.1rem;">خروج</button>
      `;
    } else {
      // User is not logged in - show login/register buttons
      navButtons.innerHTML = `
        <a href="chat.html" class="btn-auth">پشتیبانی</a>
        <a href="login.html" class="btn-auth">ورود</a>
        <a href="register.html" class="btn-auth">ثبت نام</a>
      `;
    }
  }
};

