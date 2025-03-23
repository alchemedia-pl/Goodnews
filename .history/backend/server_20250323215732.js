// server.js - Express backend for news aggregator
const express = require('express');
const axios = require('axios');
const Parser = require('rss-parser');
const natural = require('natural');
const cors = require('cors');
const path = require('path');

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory storage (replace with database in production)
let cachedNews = [];
let lastFetchTime = null;

// Sources configuration
const sources = {
  tech: [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.theverge.com/rss/index.xml'
  ],
  hardware: [
    'https://www.anandtech.com/rss/',
    'https://www.tomshardware.com/feeds/all'
  ],
  design: [
    'https://www.smashingmagazine.com/feed/',
    'https://alistapart.com/main/feed/'
  ],
  science: [
    'https://www.sciencedaily.com/rss/all.xml',
    'http://feeds.nature.com/nature/rss/current'
  ]
};

// Political terms to filter out
const politicalTerms = [
  'democrat', 'republican', 'congress', 'senate', 'president', 
  'election', 'vote', 'political', 'policy', 'government'
];

// Fetch and process news from all sources
async function fetchAllNews() {
  const allNews = [];
  
  for (const [category, feeds] of Object.entries(sources)) {
    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        
        feed.items.forEach(item => {
          // Basic filtering
          if (!isPolitical(item)) {
            allNews.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              content: item.contentSnippet || item.content,
              source: feed.title,
              category
            });
          }
        });
      } catch (error) {
        console.error(`Error fetching ${feedUrl}:`, error.message);
      }
    }
  }
  
  return allNews;
}

// Check if content is political
function isPolitical(item) {
  const content = (item.title + ' ' + (item.contentSnippet || item.content)).toLowerCase();
  return politicalTerms.some(term => content.includes(term));
}

// API endpoint to get news
app.get('/api/news', async (req, res) => {
  try {
    // Refresh cache every 30 minutes
    const now = new Date();
    if (!lastFetchTime || (now - lastFetchTime) > 30 * 60 * 1000) {
      cachedNews = await fetchAllNews();
      lastFetchTime = now;
    }
    
    // Filter based on user preferences
    const categories = req.query.categories ? req.query.categories.split(',') : [];
    let filteredNews = cachedNews;
    
    if (categories.length > 0) {
      filteredNews = cachedNews.filter(item => categories.includes(item.category));
    }
    
    res.json(filteredNews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User preferences endpoint (simplified)
app.post('/api/preferences', (req, res) => {
  // In a real app, save to database
  console.log('Received preferences:', req.body);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});