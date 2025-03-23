
// frontend/app.js
document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('news-container');
    const categoryFilters = document.querySelectorAll('.category-filter');
    
    // Get selected categories
    function getSelectedCategories() {
      return Array.from(categoryFilters)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    }
    
    // Fetch news based on selected categories
    async function fetchNews() {
      const categories = getSelectedCategories();
      const url = `/api/news?categories=${categories.join(',')}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const news = await response.json();
        displayNews(news);
      } catch (error) {
        console.error('Error fetching news:', error);
        newsContainer.innerHTML = `<div class="col-span-full text-center text-red-500">
          Error loading news. Please try again later.
        </div>`;
      }
    }
    
    // Display news items
    function displayNews(news) {
      if (news.length === 0) {
        newsContainer.innerHTML = `<div class="col-span-full text-center">
          No news found for the selected categories.
        </div>`;
        return;
      }
      
      newsContainer.innerHTML = news.map(item => `
        <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center mb-4">
            <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              ${item.category}
            </span>
            <span class="text-gray-500 text-sm ml-auto">
              ${new Date(item.pubDate).toLocaleDateString()}
            </span>
          </div>
          <h2 class="text-xl font-bold mb-2">${item.title}</h2>
          <p class="text-gray-600 mb-4 line-clamp-3">${item.content}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">${item.source}</span>
            <a href="${item.link}" target="_blank" class="text-blue-600 hover:underline">
              Read more
            </a>
          </div>
        </div>
      `).join('');
    }
    
    // Add event listeners to category filters
    categoryFilters.forEach(checkbox => {
      checkbox.addEventListener('change', fetchNews);
    });
    
    // Initial fetch
    fetchNews();
    
    // Save user preferences (simplified)
    function savePreferences() {
      const preferences = {
        categories: getSelectedCategories()
      };
      
      fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })
      .catch(error => console.error('Error saving preferences:', error));
    }
    
    // Save preferences when filters change
    categoryFilters.forEach(checkbox => {
      checkbox.addEventListener('change', savePreferences);
    });
  });