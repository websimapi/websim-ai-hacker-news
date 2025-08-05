const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0';
const STORIES_TO_LOAD = 16;

const loadingIndicator = document.getElementById('loading-indicator');
const storiesGrid = document.getElementById('stories-grid');
const errorContainer = document.getElementById('error-container');
const iframeModal = document.getElementById('iframe-modal');
const storyIframe = document.getElementById('story-iframe');
const closeIframeBtn = document.getElementById('close-iframe-btn');

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function isValidHttpUrl(string) {
    if (!string) return false;
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
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
    const storyUrl = isValidHttpUrl(story.url) ? story.url : `https://news.ycombinator.com/item?id=${story.id}`;
    link.href = storyUrl;
    link.textContent = story.title;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    title.appendChild(link);

    link.addEventListener('click', (e) => {
        // Only override primary button clicks without modifier keys
        if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            openIframeModal(storyUrl);
        }
    });

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

function openIframeModal(url) {
    storyIframe.src = url;
    iframeModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeIframeModal() {
    iframeModal.classList.add('hidden');
    storyIframe.src = 'about:blank'; // Stop loading and clear content
    document.body.classList.remove('modal-open');
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
        loadingIndicator.classList.add('hidden');
        errorContainer.innerHTML = '<p>Could not load stories. Please try again later.</p>';
        errorContainer.classList.remove('hidden');
    }
}

closeIframeBtn.addEventListener('click', closeIframeModal);

main();