// app.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("commentForm");
  const commentsList = document.getElementById("commentsList");

  // بارگذاری نظرات
  const loadComments = () => {
    const comments = JSON.parse(localStorage.getItem("myMateComments")) || [];
    commentsList.innerHTML = comments.length === 0
      ? "<p class='text-center text-gray-600'>نظری ثبت نشده است.</p>"
      : comments
          .map(
            (c) => `
        <div class="bg-white rounded-lg p-4 shadow">
          <p class="font-bold text-yellow-800">${c.name}</p>
          <p class="mt-2 text-yellow-900">${c.comment}</p>
        </div>`
          )
          .join("");
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const comment = form.comment.value.trim();

    if (!name || !comment) return;

    const comments = JSON.parse(localStorage.getItem("myMateComments")) || [];
    comments.push({ name, comment });
    localStorage.setItem("myMateComments", JSON.stringify(comments));

    form.reset();
    loadComments();
  });

  loadComments();
});
