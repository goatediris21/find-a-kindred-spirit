function esc(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

const REVIEW_KEY = "kindred-reviews";

const ReviewStore = {
  all() {
    try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]"); } catch (e) { return []; }
  },
  add(review) {
    const reviews = this.all();
    reviews.unshift(review);
    try { localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews)); } catch (e) {}
    return reviews;
  }
};

function renderReviews() {
  const list = document.getElementById("review-list");
  if (!list) return;
  const reviews = ReviewStore.all();
  if (!reviews.length) {
    list.innerHTML = '<p class="empty">No reviews yet — be the first!</p>';
    return;
  }
  list.innerHTML = reviews.map(r => `
    <div class="review">
      <div class="stars">${"\u2605".repeat(r.rating)}${"\u2606".repeat(5 - r.rating)}</div>
      <p>"${esc(r.text)}"</p>
      <div class="who"><b>${esc(r.name)}</b></div>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const starBtns = [...document.querySelectorAll("#stars-input button")];
  const reviewForm = document.getElementById("review-form");
  const reviewName = document.getElementById("review-name");
  const reviewText = document.getElementById("review-text");
  const reviewMsg = document.getElementById("review-msg");

  if (!reviewForm) return;

  starBtns.forEach(b => b.addEventListener("click", () => {
    const rating = Number(b.dataset.value);
    starBtns.forEach((s, i) => s.classList.toggle("on", i < rating));
  }));

  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const rating = starBtns.filter(b => b.classList.contains("on")).length;
    const name = reviewName.value.trim();
    const text = reviewText.value.trim();
    if (!rating) {
      reviewMsg.style.color = "#c0392b";
      reviewMsg.textContent = "Please pick a star rating.";
      return;
    }
    if (!name) {
      reviewMsg.style.color = "#c0392b";
      reviewMsg.textContent = "Please enter your name.";
      return;
    }
    if (!text) {
      reviewMsg.style.color = "#c0392b";
      reviewMsg.textContent = "Please write a short review.";
      return;
    }
    ReviewStore.add({ rating, name, text });
    reviewForm.reset();
    starBtns.forEach(s => s.classList.remove("on"));
    reviewMsg.style.color = "#3a8f74";
    reviewMsg.textContent = "\u2705 Thanks! Your review has been posted.";
    renderReviews();
  });

  renderReviews();
});
