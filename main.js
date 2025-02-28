// User credentials - In a real app, these would be in a secure database
const USERS = {
    "creator": { password: "creator123", role: "creator" },
    "assistant": { password: "assistant123", role: "assistant" }
};

// Local storage keys
const TICKETS_STORAGE_KEY = 'ticketSystemTickets';
const CURRENT_USER_KEY = 'ticketSystemCurrentUser';

// DOM Elements - Navigation
const homeLink = document.getElementById('homeLink');
const ticketsLink = document.getElementById('ticketsLink');
const aboutLink = document.getElementById('aboutLink');
const homeTicketsBtn = document.getElementById('homeTicketsBtn');

// DOM Elements - Sections
const homeSection = document.getElementById('homeSection');
const ticketsSection = document.getElementById('ticketsSection');
const aboutSection = document.getElementById('aboutSection');

// DOM Elements - Ticket System
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const ticketModal = document.getElementById('ticketModal');
const welcomeMessage = document.getElementById('welcomeMessage');
const ticketsList = document.getElementById('ticketsList');

// Login Elements
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');
const logoutBtn = document.getElementById('logoutBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');

// Ticket Modal Elements
const modalTitle = document.getElementById('modalTitle');
const ticketTitleInput = document.getElementById('ticketTitle');
const shotInput = document.getElementById('shot');
const sentToAssistantInput = document.getElementById('sentToAssistant');
const cutInput = document.getElementById('cut');
const coverAddedInput = document.getElementById('coverAdded');
const sentBackToCreatorInput = document.getElementById('sentBackToCreator');
const postedToLTKInput = document.getElementById('postedToLTK');
const pinnedInput = document.getElementById('pinned');
const saveTicketBtn = document.getElementById('saveTicketBtn');
const cancelTicketBtn = document.getElementById('cancelTicketBtn');
const createTicketBtn = document.getElementById('createTicketBtn');
const closeModalBtn = document.querySelector('.close-modal');

// State
let currentUser = null;
let tickets = [];
let currentTicketId = null;

// Initialize the app
async function init() {
    loadUserFromStorage();
    await loadTicketsFromStorage();
    
    // Set up navigation event listeners
    homeLink.addEventListener('click', showHomeSection);
    ticketsLink.addEventListener('click', showTicketsSection);
    aboutLink.addEventListener('click', showAboutSection);
    homeTicketsBtn.addEventListener('click', showTicketsSection);
    
    // Set up ticket system event listeners
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    backToHomeBtn.addEventListener('click', showHomeSection);
    createTicketBtn.addEventListener('click', openCreateTicketModal);
    saveTicketBtn.addEventListener('click', handleSaveTicket);
    cancelTicketBtn.addEventListener('click', closeTicketModal);
    closeModalBtn.addEventListener('click', closeTicketModal);
    
    // Initial section display
    showHomeSection();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Show Home Section
function showHomeSection(e) {
    if (e) e.preventDefault();
    
    homeSection.classList.remove('hidden');
    ticketsSection.classList.add('hidden');
    aboutSection.classList.add('hidden');
    
    // Update active navigation
    setActiveNavLink(homeLink);
}

// Show Tickets Section
function showTicketsSection(e) {
    if (e) e.preventDefault();
    
    homeSection.classList.add('hidden');
    ticketsSection.classList.remove('hidden');
    aboutSection.classList.add('hidden');
    
    // Update active navigation
    setActiveNavLink(ticketsLink);
    
    // Check if user is logged in
    if (currentUser) {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        renderTickets();
    } else {
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }
}

// Show About Section
function showAboutSection(e) {
    if (e) e.preventDefault();
    
    homeSection.classList.add('hidden');
    ticketsSection.classList.add('hidden');
    aboutSection.classList.remove('hidden');
    
    // Update active navigation
    setActiveNavLink(aboutLink);
}

// Set active navigation link
function setActiveNavLink(activeLink) {
    // Remove active class from all links
    homeLink.classList.remove('active');
    ticketsLink.classList.remove('active');
    aboutLink.classList.remove('active');
    
    // Add active class to the current link
    activeLink.classList.add('active');
}

// Load user from localStorage
function loadUserFromStorage() {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
}

// Load tickets from Firebase
async function loadTicketsFromStorage() {
    try {
        const snapshot = await db.collection('tickets').orderBy('order').get();
        tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading tickets:", error);
        
        // Fallback to localStorage if Firebase fails
        const storedTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
        if (storedTickets) {
            tickets = JSON.parse(storedTickets);
        }
    }
}

// Save tickets to Firebase
async function saveTicketsToStorage() {
    try {
        // Create a batch to update multiple documents at once
        const batch = db.batch();
        
        // Add each ticket to the batch
        tickets.forEach(ticket => {
            const docRef = db.collection('tickets').doc(ticket.id);
            batch.set(docRef, ticket);
        });
        
        // Commit the batch
        await batch.commit();
        
        // Also save to localStorage as backup
        localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    } catch (error) {
        console.error("Error saving tickets to Firebase:", error);
        // Fallback to localStorage only
        localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    }
}

// Save user to localStorage
function saveUserToStorage() {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
}

// Handle login
function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        loginMessage.textContent = 'Please enter both username and password';
        return;
    }
    
    const user = USERS[username];
    
    if (!user || user.password !== password) {
        loginMessage.textContent = 'Invalid username or password';
        return;
    }
    
    currentUser = {
        username,
        role: user.role
    };
    
    saveUserToStorage();
    
    // Show dashboard
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    
    // Set welcome message
    welcomeMessage.textContent = `Welcome, ${currentUser.username} (${currentUser.role})`;
    
    // Render tickets
    renderTickets();
}

// Handle logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    
    // Clear inputs
    usernameInput.value = '';
    passwordInput.value = '';
    loginMessage.textContent = '';
}

// Render tickets
function renderTickets() {
    ticketsList.innerHTML = '';
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p class="no-tickets">No tickets found. Create your first ticket!</p>';
        return;
    }
    
    // Sort tickets by their order property if it exists, otherwise keep original order
    const sortedTickets = [...tickets].sort((a, b) => {
        // If order property doesn't exist, maintain current order
        if (a.order === undefined || b.order === undefined) return 0;
        return a.order - b.order;
    });
    
    sortedTickets.forEach(ticket => {
        const ticketElement = createTicketElement(ticket);
        ticketsList.appendChild(ticketElement);
    });
    
    // Initialize drag-and-drop functionality
    initSortable();
}

// Create ticket element
function createTicketElement(ticket) {
    const ticketCard = document.createElement('div');
    ticketCard.className = `ticket-card ${ticket.pinned ? 'pinned-ticket' : ''}`;
    ticketCard.setAttribute('data-id', ticket.id);
    
    const ticketHeader = document.createElement('div');
    ticketHeader.className = 'ticket-header';
    
    const ticketTitle = document.createElement('h3');
    ticketTitle.className = 'ticket-title';
    ticketTitle.textContent = ticket.title;
    
    const ticketCreator = document.createElement('div');
    ticketCreator.className = 'ticket-creator';
    ticketCreator.textContent = `Created by: ${ticket.createdBy}`;
    
    const ticketStatus = document.createElement('div');
    ticketStatus.className = 'ticket-status';
    
    // Add status tags
    addStatusTag(ticketStatus, ticket.shot, 'Shot');
    addStatusTag(ticketStatus, ticket.sentToAssistant, 'Sent to assistant');
    addStatusTag(ticketStatus, ticket.cut, 'Cut');
    addStatusTag(ticketStatus, ticket.coverAdded, 'Cover added');
    addStatusTag(ticketStatus, ticket.sentBackToCreator, 'Sent back to creator');
    addStatusTag(ticketStatus, ticket.postedToLTK, 'Posted to LTK');
    addStatusTag(ticketStatus, ticket.pinned, 'Pinned');
    
    const ticketActions = document.createElement('div');
    ticketActions.className = 'ticket-actions-menu';
    
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => openEditTicketModal(ticket.id));
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteTicket(ticket.id));
    
    ticketActions.appendChild(editButton);
    ticketActions.appendChild(deleteButton);
    
    ticketHeader.appendChild(ticketTitle);
    
    ticketCard.appendChild(ticketHeader);
    ticketCard.appendChild(ticketCreator);
    ticketCard.appendChild(ticketStatus);
    ticketCard.appendChild(ticketActions);
    
    return ticketCard;
}

// Add status tag to ticket
function addStatusTag(container, isActive, label) {
    if (isActive) {
        const tag = document.createElement('span');
        tag.className = 'status-tag completed';
        tag.textContent = label;
        container.appendChild(tag);
    }
}

// Open create ticket modal
function openCreateTicketModal() {
    modalTitle.textContent = 'Create New Ticket';
    currentTicketId = null;
    
    // Reset form
    ticketTitleInput.value = '';
    shotInput.checked = false;
    sentToAssistantInput.checked = false;
    cutInput.checked = false;
    coverAddedInput.checked = false;
    sentBackToCreatorInput.checked = false;
    postedToLTKInput.checked = false;
    pinnedInput.checked = false;
    
    ticketModal.classList.remove('hidden');
}

// Open edit ticket modal
function openEditTicketModal(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    currentTicketId = ticketId;
    modalTitle.textContent = 'Edit Ticket';
    
    // Fill form with ticket data
    ticketTitleInput.value = ticket.title;
    shotInput.checked = ticket.shot || false;
    sentToAssistantInput.checked = ticket.sentToAssistant;
    cutInput.checked = ticket.cut;
    coverAddedInput.checked = ticket.coverAdded;
    sentBackToCreatorInput.checked = ticket.sentBackToCreator;
    postedToLTKInput.checked = ticket.postedToLTK;
    pinnedInput.checked = ticket.pinned;
    
    ticketModal.classList.remove('hidden');
}

// Close ticket modal
function closeTicketModal() {
    ticketModal.classList.add('hidden');
}

// Handle save ticket
function handleSaveTicket() {
    const ticketTitle = ticketTitleInput.value.trim();
    
    if (!ticketTitle) {
        alert('Please enter a ticket title');
        return;
    }
    
    if (currentTicketId) {
        // Edit existing ticket
        const ticketIndex = tickets.findIndex(t => t.id === currentTicketId);
        if (ticketIndex !== -1) {
            tickets[ticketIndex] = {
                ...tickets[ticketIndex],
                title: ticketTitle,
                shot: shotInput.checked,
                sentToAssistant: sentToAssistantInput.checked,
                cut: cutInput.checked,
                coverAdded: coverAddedInput.checked,
                sentBackToCreator: sentBackToCreatorInput.checked,
                postedToLTK: postedToLTKInput.checked,
                pinned: pinnedInput.checked,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Update all existing tickets' order to make room for the new ticket at the front
tickets = tickets.map(ticket => ({
    ...ticket,
    order: (ticket.order !== undefined ? ticket.order : 0) + 1
}));

// Create new ticket with order 0 to place at the beginning
const newTicket = {
    id: Date.now().toString(),
    title: ticketTitle,
    shot: shotInput.checked,
    sentToAssistant: sentToAssistantInput.checked,
    cut: cutInput.checked,
    coverAdded: coverAddedInput.checked,
    sentBackToCreator: sentBackToCreatorInput.checked,
    postedToLTK: postedToLTKInput.checked,
    pinned: pinnedInput.checked,
    createdBy: currentUser.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 0 // Set order to place at the beginning
};

tickets.push(newTicket);
    }
    
    saveTicketsToStorage();
    renderTickets();
    closeTicketModal();
}

// Delete ticket
async function deleteTicket(ticketId) {
    if (confirm('Are you sure you want to delete this ticket?')) {
        try {
            // Delete from Firebase
            await db.collection('tickets').doc(ticketId).delete();
            
            // Update local array
            tickets = tickets.filter(t => t.id !== ticketId);
            
            // Update local storage backup
            localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
            
            // Refresh the UI
            renderTickets();
        } catch (error) {
            console.error("Error deleting ticket:", error);
            alert("There was an error deleting the ticket. Please try again.");
        }
    }
}

// Initialize Sortable for drag-and-drop functionality
function initSortable() {
    if (ticketsList.children.length <= 1) return; // Don't initialize if only one or no tickets
    
    // Create new Sortable instance
    new Sortable(ticketsList, {
        animation: 600, // Animation speed
        ghostClass: 'hidden', // Hide the ghost element completely
        chosenClass: 'ticket-card-chosen', // Class for the chosen item
        dragClass: 'ticket-card-drag', // Class for the dragging item
        handle: '.ticket-header', // Drag handle selector within list items
        
        // Add easing function for dangling effect
        easing: "cubic-bezier(.68,-0.55,.27,1.55)", // Bouncy easing
        
        // Increase delay for more dramatic effect
        delay: 80,
        
        // Add a custom insertion point indicator
        onStart: function(evt) {
            // Create insertion indicator
            const indicator = document.createElement('div');
            indicator.className = 'insertion-indicator';
            document.body.appendChild(indicator);
        },
        
        onMove: function(evt) {
            // Position the indicator between items
            const indicator = document.querySelector('.insertion-indicator');
            if (indicator) {
                const targetRect = evt.related.getBoundingClientRect();
                const ticketsListRect = ticketsList.getBoundingClientRect();
                
                // Position indicator on the left or right edge of the target element
                // depending on which half of the element the pointer is on
                let isAfter = evt.originalEvent.clientX > targetRect.left + (targetRect.width / 2);
                
                indicator.style.height = `${ticketsListRect.height}px`;
                indicator.style.top = `${ticketsListRect.top}px`;
                
                if (isAfter) {
                    indicator.style.left = `${targetRect.right}px`;
                } else {
                    indicator.style.left = `${targetRect.left}px`;
                }
                
                indicator.style.display = 'block';
            }
        },
        
        onEnd: function(evt) {
            // Remove the insertion indicator
            const indicator = document.querySelector('.insertion-indicator');
            if (indicator) {
                indicator.remove();
            }
            
            // Update the order of tickets in storage after dragging ends
            updateTicketsOrder();
        }
    });
}

// Update the order property of tickets based on their current position in the DOM
function updateTicketsOrder() {
    // Get all ticket elements
    const ticketElements = ticketsList.querySelectorAll('.ticket-card');
    
    // Create a map to store new orders
    const newOrders = {};
    
    // Assign order based on position
    ticketElements.forEach((element, index) => {
        const ticketId = element.getAttribute('data-id');
        newOrders[ticketId] = index;
    });
    
    // Update tickets array with new orders
    tickets = tickets.map(ticket => ({
        ...ticket,
        order: newOrders[ticket.id]
    }));
    
    // Save to storage
    saveTicketsToStorage();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);