document.addEventListener('DOMContentLoaded', function () {
    const booksContainer = document.getElementById('booksContainer');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const sortSelect = document.getElementById('sortSelect');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noResults = document.getElementById('noResults');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const yearRange = document.getElementById('yearRange');
    const ratingFilters = document.querySelectorAll('.rating-filter input[type="checkbox"]');
    const languageFilter = document.getElementById('languageFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const currentYearValue = document.getElementById('currentYearValue');
    const filterToggle = document.getElementById('filterToggle');
    const sidebar = document.querySelector('.sidebar');
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');
    const closeSidebar = document.getElementById('closeSidebar');

    let books = [];
    let filteredBooks = [];
    let currentPage = 1;
    const booksPerPage = 8;
    let currentSort = 'title-asc';
    let currentView = 'grid';
    let currentFilters = {
        maxYear: 2023,
        minRating: 0,
        language: 'all'
    };

    // Initialize the application
    init();

    function init() {
        setInitialView();
        setupEventListeners();
        fetchBooks();
        loadUserPreferences();
    }

    function loadUserPreferences() {
        const savedView = localStorage.getItem('bookViewPreference');
        if (savedView) {
            toggleView(savedView);
        }
    }

    function setInitialView() {
        toggleView('grid');
    }

    function toggleMenu() {
        if (!sidebar.classList.contains('show')) {
            navLinks.classList.toggle('show');
        }
    }

    function toggleView(viewType) {
        currentView = viewType;
        localStorage.setItem('bookViewPreference', viewType);

        if (viewType === 'grid') {
            booksContainer.classList.remove('list-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            booksContainer.classList.add('list-view');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        }

        // Re-display books to ensure proper layout
        displayBooks();
    }

    function setupEventListeners() {
        // View toggle listeners
        gridViewBtn.addEventListener('click', () => toggleView('grid'));
        listViewBtn.addEventListener('click', () => toggleView('list'));

        // Mobile menu toggle
        menuToggle.addEventListener('click', toggleMenu);

        // Filter sidebar toggle
        filterToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
            navLinks.classList.remove('show');
        });

        closeSidebar.addEventListener('click', function () {
            sidebar.classList.remove('show');
        });

        // Search functionality
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keyup', function (e) {
            if (e.key === 'Enter') handleSearch();
        });

        // Debounced search input
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(handleSearch, 300);
        });

        // Sort functionality
        sortSelect.addEventListener('change', function () {
            currentSort = this.value;
            sortBooks();
            displayBooks();
        });

        // Filter functionality
        yearRange.addEventListener('input', function () {
            currentYearValue.textContent = this.value;
        });

        applyFiltersBtn.addEventListener('click', function () {
            applyFilters(true);
        });

        // Pagination
        prevPageBtn.addEventListener('click', goToPreviousPage);
        nextPageBtn.addEventListener('click', goToNextPage);

        // Close filters when clicking outside
        document.addEventListener('click', function (event) {
            if (!sidebar.contains(event.target)) {
                sidebar.classList.remove('show');
            }
        });
    }

    async function fetchBooks() {
        try {
            showLoadingState();

            const response = await fetch('https://api.freeapi.app/api/v1/public/books');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success || !data.data?.data) {
                throw new Error('Invalid data format from API');
            }

            books = processBookData(data.data.data);
            filteredBooks = [...books];
            sortBooks();
            displayBooks();

        } catch (error) {
            showErrorState(error);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    function processBookData(bookData) {
        return bookData.map(book => {
            const publishedYear = book.volumeInfo?.publishedDate
                ? new Date(book.volumeInfo.publishedDate).getFullYear()
                : Math.floor(Math.random() * (2023 - 1900 + 1)) + 1900;

            return {
                id: book.id,
                title: book.volumeInfo?.title || 'No title available',
                authors: book.volumeInfo?.authors?.join(', ') || 'Unknown author',
                publisher: book.volumeInfo?.publisher || 'Unknown publisher',
                publishedDate: book.volumeInfo?.publishedDate || 'No date available',
                publishedYear: publishedYear,
                description: book.volumeInfo?.description || 'No description available',
                pageCount: book.volumeInfo?.pageCount || 0,
                categories: book.volumeInfo?.categories?.join(', ') || 'Uncategorized',
                language: book.volumeInfo?.language || 'en',
                thumbnail: book.volumeInfo?.imageLinks?.thumbnail || 'https://via.placeholder.com/150x200?text=No+Image',
                infoLink: book.volumeInfo?.infoLink || '#',
                previewLink: book.volumeInfo?.previewLink || '#',
                rating: (Math.random() * 4 + 1).toFixed(1),
                ratingCount: Math.floor(Math.random() * 1000),
                isAvailable: Math.random() > 0.3,
                isbn: Math.random().toString(36).substring(2, 15)
            };
        });
    }

    function showLoadingState() {
        loadingIndicator.style.display = 'flex';
        noResults.style.display = 'none';
        booksContainer.style.display = 'none';
    }

    function showErrorState(error) {
        console.error('Error fetching books:', error);
        booksContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load books. Please try again later.</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
        booksContainer.style.display = 'block';
        noResults.style.display = 'none';
    }

    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();

        if (searchTerm.length === 0) {
            filteredBooks = [...books];
        } else if (searchTerm.length >= 3) {
            filteredBooks = books.filter(book => {
                const normalizedSearchTerm = searchTerm.normalize().toLowerCase();
                const normalizedTitle = (book.title || '').normalize().toLowerCase();
                const normalizedAuthors = (book.authors || '').normalize().toLowerCase();

                return normalizedTitle.includes(normalizedSearchTerm) ||
                    normalizedAuthors.includes(normalizedSearchTerm);
            });
        }

        currentPage = 1;
        applyFilters(false);
        displayBooks();
    }

    function applyFilters(resetPage = true) {
        loadingIndicator.style.display = 'flex';

        setTimeout(() => {
            currentFilters.maxYear = parseInt(yearRange.value);

            currentFilters.minRating = 0;
            ratingFilters.forEach(filter => {
                if (filter.checked) {
                    currentFilters.minRating = Math.max(currentFilters.minRating, parseInt(filter.value));
                }
            });

            currentFilters.language = languageFilter.value;

            let booksToFilter = searchInput.value.trim().length >= 3 ? filteredBooks : [...books];

            filteredBooks = booksToFilter.filter(book => {
                const year = book.publishedYear;
                const rating = parseFloat(book.rating);
                const matchesYear = year <= currentFilters.maxYear;
                const matchesRating = rating >= currentFilters.minRating;
                const matchesLanguage = currentFilters.language === 'all' ||
                    book.language === currentFilters.language;

                return matchesYear && matchesRating && matchesLanguage;
            });

            if (resetPage) {
                currentPage = 1;
            }

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
            }

            sortBooks();
            displayBooks();
            loadingIndicator.style.display = 'none';
        }, 300);
    }

    function sortBooks() {
        switch (currentSort) {
            case 'title-asc':
                filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'year-desc':
                filteredBooks.sort((a, b) => b.publishedYear - a.publishedYear);
                break;
            case 'year-asc':
                filteredBooks.sort((a, b) => a.publishedYear - b.publishedYear);
                break;
            case 'rating-desc':
                filteredBooks.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
                break;
            default:
                break;
        }
    }

    function displayBooks() {
        if (filteredBooks.length === 0) {
            noResults.style.display = 'block';
            booksContainer.style.display = 'none';
            return;
        }

        noResults.style.display = 'none';
        booksContainer.style.display = currentView === 'grid' ? 'grid' : 'block';
        booksContainer.innerHTML = '';

        const startIndex = (currentPage - 1) * booksPerPage;
        const endIndex = Math.min(startIndex + booksPerPage, filteredBooks.length);
        const booksToDisplay = filteredBooks.slice(startIndex, endIndex);

        booksToDisplay.forEach(book => {
            const bookElement = createBookElement(book);
            booksContainer.appendChild(bookElement);
        });

        updatePagination();
    }

    function createBookElement(book) {
        try {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.setAttribute('data-id', book.id);

            const thumbnail = book.thumbnail || 'https://via.placeholder.com/150x200?text=No+Image';
            const authors = book.authors || 'Unknown author';
            const rating = parseFloat(book.rating) || 0;
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

            let starsHTML = '';
            for (let i = 0; i < fullStars; i++) {
                starsHTML += '<i class="fas fa-star star-filled"></i>';
            }
            if (hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt star-filled"></i>';
            }
            for (let i = 0; i < emptyStars; i++) {
                starsHTML += '<i class="far fa-star star-empty"></i>';
            }

            bookCard.innerHTML = `
                <img src="${thumbnail}" alt="${book.title}" class="book-thumbnail">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${authors}</p>
                    <div class="book-rating">
                        ${starsHTML}
                        <span class="rating-count">(${book.ratingCount || 0})</span>
                    </div>
                    <div class="book-meta">
                        <span class="book-year">${book.publishedYear}</span>
                        <span class="book-language">${book.language.toUpperCase()}</span>
                    </div>
                    <span class="book-availability ${book.isAvailable ? 'available' : 'unavailable'}">
                        ${book.isAvailable ? 'Available' : 'Borrowed'}
                    </span>
                    <button class="borrow-btn" ${!book.isAvailable ? 'disabled' : ''}>
                        <i class="fas fa-book"></i> ${book.isAvailable ? 'Borrow' : 'Unavailable'}
                    </button>
                </div>
            `;

            bookCard.addEventListener('click', function (e) {
                if (!e.target.closest('.borrow-btn') && book.infoLink) {
                    e.preventDefault();
                    window.open(book.infoLink, '_blank');
                }
            });

            const borrowBtn = bookCard.querySelector('.borrow-btn');
            borrowBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                borrowBook(book, bookCard);
            });

            return bookCard;
        } catch (error) {
            console.error('Error creating book element:', error);
            const errorCard = document.createElement('div');
            errorCard.className = 'book-card error';
            errorCard.innerHTML = '<p>Error displaying this book</p>';
            return errorCard;
        }
    }

    function borrowBook(book, bookElement) {
        console.log('Borrowing book:', book.title);
        book.isAvailable = false;

        // Update the specific book card
        if (bookElement) {
            const availability = bookElement.querySelector('.book-availability');
            const borrowBtn = bookElement.querySelector('.borrow-btn');

            if (availability) {
                availability.classList.remove('available');
                availability.classList.add('unavailable');
                availability.textContent = 'Borrowed';
            }

            if (borrowBtn) {
                borrowBtn.disabled = true;
                borrowBtn.innerHTML = '<i class="fas fa-book"></i> Unavailable';
            }
        }

        alert(`You've borrowed "${book.title}"! Please return it by ${getDueDate()}.`);
    }

    function getDueDate() {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        return dueDate.toLocaleDateString();
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            displayBooks();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function goToNextPage() {
        const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

        if (currentPage < totalPages) {
            currentPage++;
            displayBooks();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});