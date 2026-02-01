// landing.js - CareerLaunch Navigation

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const mainNav = document.querySelector('.main-nav');
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileCloseBtn = document.querySelector('.mobile-close-btn');
    const userDropdown = document.querySelector('.user-dropdown');
    const userMenuBtn = document.querySelector('.user-menu-btn');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const ctaButtons = document.querySelectorAll('.nav-cta-button, .cta-button, .mobile-cta-button, .floating-apply-btn');
    const logo = document.querySelector('.logo');
    
    // State
    let mobileMenuOpen = false;
    let dropdownOpen = false;
    let scrolled = false;

    // Create overlay for mobile menu
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    // Initialize
    initNavigation();

    function initNavigation() {
        setupEventListeners();
        setupScrollSpy();
        handleScroll();
        setupMobileMenuHeight();
        addAnimationStyles();
    }

    function setupEventListeners() {
        // Mobile Menu
        menuToggle?.addEventListener('click', toggleMobileMenu);
        mobileCloseBtn?.addEventListener('click', closeMobileMenu);
        overlay.addEventListener('click', closeMobileMenu);

        // User Dropdown
        userMenuBtn?.addEventListener('click', toggleUserDropdown);
        document.addEventListener('click', handleOutsideClick);

        // Nav Links
        navLinks.forEach(link => {
            link.addEventListener('click', handleNavLinkClick);
        });

        // Dropdown Items
        dropdownItems.forEach(item => {
            item.addEventListener('click', handleDropdownClick);
        });

        // CTA Buttons
        ctaButtons.forEach(button => {
            button.addEventListener('click', handleCtaClick);
        });

        // Logo hover effect
        logo?.addEventListener('mouseenter', () => {
            const logoIcon = logo.querySelector('i');
            logoIcon.style.animation = 'rocketLaunch 0.5s ease forwards';
        });

        // Window Events
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        document.addEventListener('keydown', handleKeyboardNavigation);
    }

    // Mobile Menu Functions
    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
        
        if (mobileMenuOpen) {
            openMobileMenu();
        } else {
            closeMobileMenu();
        }
    }

    function openMobileMenu() {
        mobileNav.classList.add('active');
        overlay.classList.add('active');
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        
        // Animate menu items
        animateMobileMenuItems();
    }

    function closeMobileMenu() {
        mobileNav.classList.remove('active');
        overlay.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        
        // Reset animations
        resetMobileMenuItems();
        mobileMenuOpen = false;
    }

    // User Dropdown Functions
    function toggleUserDropdown(e) {
        e.stopPropagation();
        dropdownOpen = !dropdownOpen;
        
        if (dropdownOpen) {
            userDropdown.classList.add('active');
            userMenuBtn.setAttribute('aria-expanded', 'true');
        } else {
            userDropdown.classList.remove('active');
            userMenuBtn.setAttribute('aria-expanded', 'false');
        }
    }

    function closeUserDropdown() {
        dropdownOpen = false;
        userDropdown.classList.remove('active');
        userMenuBtn.setAttribute('aria-expanded', 'false');
    }

    function handleOutsideClick(e) {
        if (!userDropdown?.contains(e.target) && dropdownOpen) {
            closeUserDropdown();
        }
    }

    // Nav Link Click Handler
    function handleNavLinkClick(e) {
        e.preventDefault();
        
        const target = this.getAttribute('href');
        
        // Remove active class from all links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to clicked link
        this.classList.add('active');
        
        if (target.startsWith('#')) {
            // Scroll to section
            scrollToSection(target);
        } else {
            // Navigate to page
            window.location.href = target;
        }
        
        // Close mobile menu if open
        if (mobileMenuOpen) {
            closeMobileMenu();
        }
    }

    // Dropdown Item Click Handler
    function handleDropdownClick(e) {
        e.stopPropagation();
        const action = this.getAttribute('href');
        
        if (action === '#logout') {
            handleLogout();
        }
        
        closeUserDropdown();
        
        if (mobileMenuOpen) {
            closeMobileMenu();
        }
    }

    // CTA Button Click Handler
    function handleCtaClick(e) {
        // Add loading animation
        const button = e.currentTarget;
        const originalHTML = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.style.pointerEvents = 'none';
        
        // Simulate loading
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.pointerEvents = 'auto';
        }, 1000);
    }

    // Scroll to Section
    function scrollToSection(sectionId) {
        const targetElement = document.querySelector(sectionId);
        if (targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Setup Scroll Spy
    function setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        
        if (sections.length === 0) return;
        
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentSection = entry.target.id;
                    updateActiveNavLink(currentSection);
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    // Update Active Nav Link
    function updateActiveNavLink(sectionId) {
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
                link.classList.add('active');
            } else if (href.startsWith('#')) {
                link.classList.remove('active');
            }
        });
    }

    // Handle Scroll
    function handleScroll() {
        const scrollPosition = window.scrollY;
        
        // Update nav background
        if (scrollPosition > 50) {
            if (!scrolled) {
                mainNav.classList.add('scrolled');
                scrolled = true;
            }
        } else {
            if (scrolled) {
                mainNav.classList.remove('scrolled');
                scrolled = false;
            }
        }
        
        // Add parallax effect to logo
        const logoIcon = document.querySelector('.logo i');
        if (logoIcon) {
            const rotation = scrollPosition * 0.1;
            logoIcon.style.transform = `rotate(${rotation}deg)`;
        }
    }

    // Handle Resize
    function handleResize() {
        // Close mobile menu on desktop
        if (window.innerWidth > 768 && mobileMenuOpen) {
            closeMobileMenu();
        }
        
        setupMobileMenuHeight();
    }

    // Setup Mobile Menu Height
    function setupMobileMenuHeight() {
        if (window.innerWidth <= 768) {
            const viewportHeight = window.innerHeight;
            mobileNav.style.height = `${viewportHeight}px`;
        }
    }

    // Animate Mobile Menu Items
    function animateMobileMenuItems() {
        const mobileLinks = mobileNav.querySelectorAll('.mobile-nav-link');
        const ctaButton = mobileNav.querySelector('.mobile-cta-button');
        const userSection = mobileNav.querySelector('.mobile-user-section');
        const socialLinks = mobileNav.querySelectorAll('.mobile-social-links a');
        
        // Reset first
        resetMobileMenuItems();
        
        // Animate with delays
        setTimeout(() => {
            mobileLinks.forEach((link, index) => {
                setTimeout(() => {
                    link.style.opacity = '1';
                    link.style.transform = 'translateX(0)';
                }, index * 50);
            });
            
            if (ctaButton) {
                setTimeout(() => {
                    ctaButton.style.opacity = '1';
                    ctaButton.style.transform = 'translateX(0)';
                }, mobileLinks.length * 50);
            }
            
            if (userSection) {
                setTimeout(() => {
                    userSection.style.opacity = '1';
                    userSection.style.transform = 'translateX(0)';
                }, (mobileLinks.length + 1) * 50);
            }
            
            socialLinks.forEach((link, index) => {
                setTimeout(() => {
                    link.style.opacity = '1';
                    link.style.transform = 'translateY(0)';
                }, (mobileLinks.length + 2 + index) * 50);
            });
        }, 300);
    }

    // Reset Mobile Menu Items
    function resetMobileMenuItems() {
        const mobileLinks = mobileNav.querySelectorAll('.mobile-nav-link');
        const ctaButton = mobileNav.querySelector('.mobile-cta-button');
        const userSection = mobileNav.querySelector('.mobile-user-section');
        const socialLinks = mobileNav.querySelectorAll('.mobile-social-links a');
        
        mobileLinks.forEach(link => {
            link.style.opacity = '0';
            link.style.transform = 'translateX(-20px)';
        });
        
        if (ctaButton) {
            ctaButton.style.opacity = '0';
            ctaButton.style.transform = 'translateX(-20px)';
        }
        
        if (userSection) {
            userSection.style.opacity = '0';
            userSection.style.transform = 'translateX(-20px)';
        }
        
        socialLinks.forEach(link => {
            link.style.opacity = '0';
            link.style.transform = 'translateY(10px)';
        });
    }

    // Handle Logout
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            const logoutBtn = document.querySelector('.logout');
            if (logoutBtn) {
                const originalHTML = logoutBtn.innerHTML;
                logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
                logoutBtn.style.pointerEvents = 'none';
                
                setTimeout(() => {
                    // In a real app, you would redirect to logout endpoint
                    console.log('User logged out');
                    logoutBtn.innerHTML = originalHTML;
                    logoutBtn.style.pointerEvents = 'auto';
                    
                    // For demo purposes, just close the dropdown
                    closeUserDropdown();
                    if (mobileMenuOpen) closeMobileMenu();
                }, 1500);
            }
        }
    }

    // Keyboard Navigation
    function handleKeyboardNavigation(e) {
        // Escape key closes menus
        if (e.key === 'Escape') {
            if (mobileMenuOpen) {
                closeMobileMenu();
            }
            if (dropdownOpen) {
                closeUserDropdown();
            }
        }
        
        // Tab key focus trap for mobile menu
        if (mobileMenuOpen && e.key === 'Tab') {
            const focusableElements = mobileNav.querySelectorAll(
                'a, button, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    // Add Animation Styles
    function addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .mobile-nav-link,
            .mobile-cta-button,
            .mobile-user-section {
                transition: all 0.3s ease !important;
            }
            
            .mobile-social-links a {
                transition: all 0.3s ease 0.1s !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Public API
    window.navigation = {
        openMobileMenu,
        closeMobileMenu,
        toggleUserDropdown,
        closeUserDropdown,
        scrollToSection
    };
});