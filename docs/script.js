// Infinite scrolling staggered posts
(function() {
  const POSTS_URL = 'posts/index.json';
  const postsContainer = document.getElementById('posts');
  const hero = document.querySelector('.hero');

  let cachedPosts = [];

  function updateOverlapVar() {
    if (!hero) return;
    const h = hero.getBoundingClientRect().height;
    const overlap = Math.round(h * 0.35);
    document.documentElement.style.setProperty('--overlap', overlap + 'px');
  }
  window.addEventListener('load', updateOverlapVar);
  window.addEventListener('resize', () => { requestAnimationFrame(updateOverlapVar); });

  // Fetch initial posts
  async function loadPosts() {
    if (cachedPosts.length) return cachedPosts;
    const res = await fetch(POSTS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load posts json');
    const data = await res.json();
    cachedPosts = Array.isArray(data) ? data : [];
    return cachedPosts;
  }

  function createCard(post, positionIndex) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper ' + (positionIndex % 2 === 0 ? 'right' : 'left');

    const hasLink = !!post.link;
    const card = hasLink ? document.createElement('a') : document.createElement('article');
    card.className = 'post-card';
    if (hasLink) {
      card.href = normalizeLink(post.link);
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    } else {
      card.tabIndex = 0;
    }

    // Date
    if (post.date) {
      const dateEl = document.createElement('div');
      dateEl.className = 'post-date';
      dateEl.textContent = formatDate(post.date);
      card.appendChild(dateEl);
    }

    const bodyEl = document.createElement('div');
    bodyEl.className = 'post-body';

    if (post.img) {
      const img = document.createElement('img');
      img.src = 'posts/' + post.img;
      img.alt = post.alt || 'Post image';
      // Lazy loading
      img.loading = 'lazy';
      bodyEl.appendChild(img);
    } else if (post.text) {
      bodyEl.textContent = post.text;
    } else {
      bodyEl.textContent = '(Empty post)';
    }
    card.appendChild(bodyEl);

    // No internal button; entire card is clickable when link exists

    wrapper.appendChild(card);
    return wrapper;
  }

  function formatDate(dateStr) {
    // Accept YYYY-MM-DD; fallback to raw
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit'});
      }
    } catch(_) {}
    return dateStr;
  }

  function normalizeLink(link) {
    if (/^https?:\/\//i.test(link)) return link;
    return 'https://' + link;
  }

  function renderAll() {
    const posts = cachedPosts;
    if (!posts.length) {
      showEnd();
      return;
    }
    posts.forEach((p, i) => {
      const cardEl = createCard(p, i);
      postsContainer.appendChild(cardEl);
      observeForReveal(cardEl.querySelector('.post-card'));
    });
    showEnd();
  }

  // IntersectionObserver for reveal animation
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  function observeForReveal(el) { revealObserver.observe(el); }

  // Initial render: fetch once then render all
  loadPosts()
    .then(() => renderAll())
    .catch(err => console.error(err));

  function showEnd() {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    const card = document.createElement('article');
    card.className = 'post-card end';
    const body = document.createElement('div');
    body.className = 'post-body';
    body.textContent = 'the end, for now';
    card.appendChild(body);
    wrapper.appendChild(card);
    postsContainer.appendChild(wrapper);
    observeForReveal(card);
  }
})();
