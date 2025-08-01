const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0';
const STORIES_TO_LOAD = 16;

const loadingIndicator = document.getElementById('loading-indicator');
const storiesGrid = document.getElementById('stories-grid');

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function createStoryCard(story) {
    const card = document.createElement('article');
    card.className = 'story-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container loading';
    imageContainer.innerHTML = '<div class="image-spinner"></div>';
    
    const content = document.createElement('div');
    content.className = 'story-content';
    
    const title = document.createElement('h3');
    const link = document.createElement('a');
    link.href = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
    link.textContent = story.title;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    title.appendChild(link);

    const meta = document.createElement('div');
    meta.className = 'story-meta';
    meta.innerHTML = `
        <span class="author">by ${story.by}</span>
        <span class="score">▲ ${story.score}</span>
    `;

    content.appendChild(title);
    content.appendChild(meta);
    card.appendChild(imageContainer);
    card.appendChild(content);

    return { card, imageContainer };
}

async function generateAndLoadImage(story, imageContainer) {
    try {
        const prompt = `Digital art, surrealism, high detail, concept art of "${story.title}"`;
        const result = await websim.imageGen({ 
            prompt,
            aspect_ratio: '1:1' 
        });

        const img = new Image();
        img.src = result.url;
        img.alt = `AI visualization of: ${story.title}`;
        
        img.onload = () => {
            imageContainer.innerHTML = ''; // Clear spinner
            img.classList.add('loaded');
            imageContainer.appendChild(img);
            imageContainer.classList.remove('loading');
        };
        img.onerror = () => {
            imageContainer.innerHTML = 'Image failed to load';
            imageContainer.classList.remove('loading');
        };
    } catch (error) {
        console.error(`Failed to generate image for story ${story.id}:`, error);
        imageContainer.innerHTML = 'Error generating image';
        imageContainer.classList.remove('loading');
    }
}

async function main() {
    try {
        const topStoryIds = await fetchJson(`${API_BASE_URL}/topstories.json`);
        const storyIdsToFetch = topStoryIds.slice(0, STORIES_TO_LOAD);
        
        const storyPromises = storyIdsToFetch.map(id => fetchJson(`${API_BASE_URL}/item/${id}.json`));
        const stories = await Promise.all(storyPromises);

        loadingIndicator.classList.add('hidden');

        stories.forEach(story => {
            if (!story) return;

            const { card, imageContainer } = createStoryCard(story);
            storiesGrid.appendChild(card);
            
            // Generate image asynchronously
            generateAndLoadImage(story, imageContainer);
        });

    } catch (error) {
        console.error('Failed to load stories:', error);
        loadingIndicator.innerHTML = '<p>Could not load stories. Please try again later.</p>';
    }
}

main();

