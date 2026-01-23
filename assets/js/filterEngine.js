/* ===================================
   Filter Engine - Core Logic
   Sistema de filtros avanzado
   =================================== */

class FilterEngine {
  constructor(options = {}) {
    this.items = options.items || [];
    this.container = options.container;
    this.searchInput = options.searchInput;
    this.filterChips = options.filterChips || [];
    this.resultsCounter = options.resultsCounter;
    this.resetButton = options.resetButton;
    this.activeFiltersContainer = options.activeFiltersContainer;
    this.noResultsElement = options.noResultsElement;

    this.activeFilters = {
      categories: [],
      technologies: [],
      types: []
    };

    this.searchQuery = '';
    this.onFilterChange = options.onFilterChange || (() => {});

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilters();
        this.updateClearButton();
      });
    }

    // Filter chips
    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => this.toggleFilter(chip));
    });

    // Reset button
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => this.resetFilters());
    }

    // Clear search button
    const clearBtn = document.querySelector('.search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (this.searchInput) {
          this.searchInput.value = '';
          this.searchQuery = '';
          this.applyFilters();
          this.updateClearButton();
        }
      });
    }
  }

  toggleFilter(chip) {
    const filterType = chip.dataset.filterType || 'categories';
    const filterValue = chip.dataset.filter;

    chip.classList.toggle('active');

    if (this.activeFilters[filterType].includes(filterValue)) {
      this.activeFilters[filterType] = this.activeFilters[filterType].filter(f => f !== filterValue);
    } else {
      this.activeFilters[filterType].push(filterValue);
    }

    this.applyFilters();
  }

  applyFilters() {
    let visibleCount = 0;
    const totalCount = this.items.length;

    this.items.forEach((item, index) => {
      const element = item.element;
      const tags = item.tags || [];
      const categories = item.categories || [];
      const types = item.types || [];
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();

      // Check search query
      const matchesSearch = !this.searchQuery ||
        title.includes(this.searchQuery) ||
        description.includes(this.searchQuery) ||
        tags.some(tag => tag.toLowerCase().includes(this.searchQuery));

      // Check category filters (OR logic within category)
      const matchesCategories = this.activeFilters.categories.length === 0 ||
        this.activeFilters.categories.some(f => categories.includes(f));

      // Check technology filters (OR logic)
      const matchesTechnologies = this.activeFilters.technologies.length === 0 ||
        this.activeFilters.technologies.some(f => tags.includes(f));

      // Check type filters (OR logic)
      const matchesTypes = this.activeFilters.types.length === 0 ||
        this.activeFilters.types.some(f => types.includes(f));

      const isVisible = matchesSearch && matchesCategories && matchesTechnologies && matchesTypes;

      if (isVisible) {
        visibleCount++;
        this.showItem(element, index);
      } else {
        this.hideItem(element);
      }
    });

    this.updateUI(visibleCount, totalCount);
    this.onFilterChange(visibleCount, totalCount);
  }

  showItem(element, index) {
    // Add stagger delay
    setTimeout(() => {
      element.classList.remove('filtered-out');
      element.classList.add('filtered-in');
      element.style.display = '';
    }, index * 30);
  }

  hideItem(element) {
    element.classList.add('filtered-out');
    element.classList.remove('filtered-in');

    // Hide after animation
    setTimeout(() => {
      if (element.classList.contains('filtered-out')) {
        element.style.display = 'none';
      }
    }, 300);
  }

  updateUI(visibleCount = null, totalCount = null) {
    // Update results counter
    if (this.resultsCounter && visibleCount !== null) {
      this.resultsCounter.innerHTML = `Mostrando <strong>${visibleCount}</strong> de <strong>${totalCount}</strong> elementos`;
    }

    // Update reset button
    if (this.resetButton) {
      const hasActiveFilters = this.hasActiveFilters();
      this.resetButton.disabled = !hasActiveFilters;
    }

    // Update active filters display
    this.updateActiveFiltersDisplay();

    // Show/hide no results message
    if (this.noResultsElement) {
      if (visibleCount === 0) {
        this.noResultsElement.style.display = 'block';
      } else {
        this.noResultsElement.style.display = 'none';
      }
    }
  }

  updateActiveFiltersDisplay() {
    if (!this.activeFiltersContainer) return;

    const allFilters = [
      ...this.activeFilters.categories,
      ...this.activeFilters.technologies,
      ...this.activeFilters.types
    ];

    if (allFilters.length === 0 && !this.searchQuery) {
      this.activeFiltersContainer.classList.remove('visible');
      return;
    }

    this.activeFiltersContainer.classList.add('visible');

    let html = '<span class="active-filters-label">Filtros activos:</span>';

    if (this.searchQuery) {
      html += `
        <span class="active-filter-tag" data-clear-search>
          "${this.searchQuery}"
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
      `;
    }

    allFilters.forEach(filter => {
      html += `
        <span class="active-filter-tag" data-clear-filter="${filter}">
          ${filter}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
      `;
    });

    this.activeFiltersContainer.innerHTML = html;

    // Bind remove events
    this.activeFiltersContainer.querySelectorAll('[data-clear-filter]').forEach(tag => {
      tag.addEventListener('click', () => {
        const filter = tag.dataset.clearFilter;
        this.removeFilter(filter);
      });
    });

    const searchTag = this.activeFiltersContainer.querySelector('[data-clear-search]');
    if (searchTag) {
      searchTag.addEventListener('click', () => {
        if (this.searchInput) {
          this.searchInput.value = '';
          this.searchQuery = '';
          this.applyFilters();
          this.updateClearButton();
        }
      });
    }
  }

  removeFilter(filter) {
    // Find and remove from all filter types
    Object.keys(this.activeFilters).forEach(type => {
      this.activeFilters[type] = this.activeFilters[type].filter(f => f !== filter);
    });

    // Update chip state
    this.filterChips.forEach(chip => {
      if (chip.dataset.filter === filter) {
        chip.classList.remove('active');
      }
    });

    this.applyFilters();
  }

  resetFilters() {
    // Reset all filters
    Object.keys(this.activeFilters).forEach(type => {
      this.activeFilters[type] = [];
    });

    // Reset search
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchQuery = '';
    }

    // Reset chip states
    this.filterChips.forEach(chip => {
      chip.classList.remove('active');
    });

    this.updateClearButton();
    this.applyFilters();

    // Add animation to container
    if (this.container) {
      this.container.classList.add('filter-animating');
      setTimeout(() => {
        this.container.classList.remove('filter-animating');
      }, 300);
    }
  }

  hasActiveFilters() {
    const hasFilters = Object.values(this.activeFilters).some(arr => arr.length > 0);
    return hasFilters || this.searchQuery.length > 0;
  }

  updateClearButton() {
    const clearBtn = document.querySelector('.search-clear');
    if (clearBtn) {
      if (this.searchQuery.length > 0) {
        clearBtn.classList.add('visible');
      } else {
        clearBtn.classList.remove('visible');
      }
    }
  }

  // Update items dynamically
  setItems(items) {
    this.items = items;
    this.applyFilters();
  }

  // Get current filter state
  getState() {
    return {
      activeFilters: { ...this.activeFilters },
      searchQuery: this.searchQuery
    };
  }

  // Restore filter state
  setState(state) {
    if (state.activeFilters) {
      this.activeFilters = { ...state.activeFilters };
    }
    if (state.searchQuery !== undefined) {
      this.searchQuery = state.searchQuery;
      if (this.searchInput) {
        this.searchInput.value = state.searchQuery;
      }
    }

    // Update chip states
    this.filterChips.forEach(chip => {
      const filterType = chip.dataset.filterType || 'categories';
      const filterValue = chip.dataset.filter;
      chip.classList.toggle('active', this.activeFilters[filterType]?.includes(filterValue));
    });

    this.applyFilters();
  }
}

// Export for use
window.FilterEngine = FilterEngine;
