// Hotel Booking System JavaScript
class HotelBookingSystem {
    constructor() {
        this.currentUser = null;
        this.currentStep = 1;
        this.currentLanguage = 'en';
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.apiBase = 'http://localhost:3001';
        this.validationMessages = {};
        this.bookingData = {
            hotelId: null,
            roomId: null,
            checkInDate: null,
            checkOutDate: null,
            name: '',
            phone: '',
            email: '',
            notes: ''
        };
        this.bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.hotels = [];
        this.rooms = [];
        this.translations = {
            hotels: {
                'Burj Al Arab': 'برج العرب',
                'The Ritz Paris': 'فندق ريتز باريس',
                'Marina Bay Sands': 'مارينا باي ساندز',
                'Four Seasons Resort Maldives': 'فور سيزونز المالديف'
            },
            locations: {
                'Dubai, UAE': 'دبي، الإمارات',
                'Paris, France': 'باريس، فرنسا',
                'Singapore': 'سنغافورة',
                'Maldives': 'جزر المالديف'
            },
            rooms: {
                'deluxe suite': 'جناح ديلوكس',
                'panoramic suite': 'جناح بانورامي',
                'superior': 'غرفة سوبريور',
                'executive suite': 'جناح تنفيذي',
                'deluxe': 'غرفة ديلوكس',
                'club room': 'غرفة كلوب',
                'beach villa': 'فيلا على الشاطئ',
                'water villa': 'فيلا فوق الماء'
            },
        };
        
        this.init();
    }

    init() {
        try {
            console.log('🏨 HotelBookingSystem: Initializing...');
            this.hideNotification(); // Ensure notification is hidden on startup
            this.setupEventListeners();
            this.applyTheme();
            this.applyLanguage();
            this.updateValidationMessages();
            this.loadUserBookings();
            this.checkAuthState();
            this.initializeAccessibility();
            this.loadBackendData();
            console.log('✅ HotelBookingSystem: Initialization complete');
        } catch (error) {
            console.error('❌ Error initializing HotelBookingSystem:', error);
            this.showNotification('System initialization failed. Please refresh the page.', 'error');
        }
    }

    initializeAccessibility() {
        // Set initial aria-pressed states
        const themeToggle = document.getElementById('themeToggle');
        const languageToggle = document.getElementById('languageToggle');
        
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', this.currentTheme === 'dark');
        }
        
        if (languageToggle) {
            languageToggle.setAttribute('aria-pressed', this.currentLanguage === 'ar');
        }
    }

    setupEventListeners() {
        // Navigation - with null checks
        const signInBtn = document.getElementById('signInBtn');
        const signUpBtn = document.getElementById('signUpBtn');
        
        if (signInBtn) signInBtn.addEventListener('click', () => this.handleSignInButtonClick());
        if (signUpBtn) signUpBtn.addEventListener('click', () => this.handleSignUpButtonClick());
        
        // Theme and Language Toggles - with null checks
        const themeToggle = document.getElementById('themeToggle');
        const languageToggle = document.getElementById('languageToggle');
        
        if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());
        if (languageToggle) languageToggle.addEventListener('click', () => this.toggleLanguage());
        
        // Modal controls - with null checks
        const closeModal = document.getElementById('closeModal');
        const closeBookingModal = document.getElementById('closeBookingModal');
        const closeDashboardModal = document.getElementById('closeDashboardModal');
        
        if (closeModal) closeModal.addEventListener('click', () => this.hideModal('authModal'));
        if (closeBookingModal) closeBookingModal.addEventListener('click', () => this.hideModal('bookingModal'));
        if (closeDashboardModal) closeDashboardModal.addEventListener('click', () => this.hideModal('dashboardModal'));
        
        // Auth form - with null checks
        const authForm = document.getElementById('authForm');
        const switchMode = document.getElementById('switchMode');
        
        if (authForm) authForm.addEventListener('submit', (e) => this.handleAuth(e));
        if (switchMode) switchMode.addEventListener('click', () => this.switchAuthMode());
        
        // Real-time form validation - with null checks
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        const confirmPasswordField = document.getElementById('confirmPassword');
        const fullNameField = document.getElementById('fullName');
        
        if (emailField) emailField.addEventListener('blur', (e) => this.validateEmailField(e.target));
        if (passwordField) passwordField.addEventListener('blur', (e) => this.validatePasswordField(e.target));
        if (confirmPasswordField) confirmPasswordField.addEventListener('blur', (e) => this.validateConfirmPasswordField(e.target));
        if (fullNameField) fullNameField.addEventListener('blur', (e) => this.validateNameField(e.target));
        
        // Booking form - with null checks
        const bookingForm = document.getElementById('bookingForm');
        const nextStep = document.getElementById('nextStep');
        const prevStep = document.getElementById('prevStep');
        
        if (bookingForm) bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        if (nextStep) nextStep.addEventListener('click', () => this.nextStep());
        if (prevStep) prevStep.addEventListener('click', () => this.prevStep());
        
        // Date selection - with null checks
        const checkInDate = document.getElementById('checkInDate');
        const checkOutDate = document.getElementById('checkOutDate');
        
        if (checkInDate) checkInDate.addEventListener('change', () => this.onDateChange());
        if (checkOutDate) checkOutDate.addEventListener('change', () => this.onDateChange());
        
        // Dashboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Profile management - with null checks
        const profileForm = document.getElementById('profileForm');
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        
        if (profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        if (changePasswordBtn) changePasswordBtn.addEventListener('click', () => this.showChangePasswordModal());
        if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', () => this.deleteAccount());
        
        // Mobile menu - with null check
        const hamburger = document.getElementById('hamburger');
        if (hamburger) hamburger.addEventListener('click', () => this.toggleMobileMenu());
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    // Theme and Language Methods
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
        
        // Update aria-pressed for accessibility
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', this.currentTheme === 'dark');
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.querySelector('#themeToggle i');
        if (this.currentTheme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }

    toggleLanguage() {
        console.log(`🌐 Switching language from ${this.currentLanguage} to ${this.currentLanguage === 'en' ? 'ar' : 'en'}`);
        this.currentLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';
        
        // Ensure notification is hidden during language switch
        this.hideNotification();
        
        this.applyLanguage();
        
        // Update aria-pressed for accessibility
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            languageToggle.setAttribute('aria-pressed', this.currentLanguage === 'ar');
        }
        
        console.log(`✅ Language switched to ${this.currentLanguage}`);
    }

    applyLanguage() {
        console.log(`🔄 Applying language: ${this.currentLanguage}`);
        document.documentElement.setAttribute('dir', this.currentLanguage === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', this.currentLanguage);
        
        // Update all elements with data attributes
        const elementsToUpdate = document.querySelectorAll('[data-en][data-ar]');
        console.log(`📝 Updating ${elementsToUpdate.length} elements with language data`);
        
        elementsToUpdate.forEach(element => {
            const text = element.getAttribute(`data-${this.currentLanguage}`);
            if (text) {
                element.textContent = text;
            }
        });
        
        // Double-check that notification is still hidden
        const notification = document.getElementById('successNotification');
        if (notification && notification.classList.contains('show')) {
            console.log('⚠️ Notification was showing during language switch, hiding it');
            this.hideNotification();
        }
        
        // Update language toggle button
        const langSpan = document.querySelector('#languageToggle span');
        if (langSpan) {
            langSpan.textContent = this.currentLanguage === 'en' ? 'عربي' : 'EN';
        }
        
        // Update placeholder texts for Arabic
        if (this.currentLanguage === 'ar') {
            this.updateArabicPlaceholders();
        }
        
        // Update form validation messages
        this.updateValidationMessages();

        // Re-render dynamic content with translations
        this.renderHotels();
        this.renderRoomOptions(this.bookingData.hotelId);
        this.updateSummary();
    }

    updateArabicPlaceholders() {
        const placeholders = {
            'email': 'example@email.com',
            'password': '••••••••',
            'confirmPassword': '••••••••',
            'fullName': 'الاسم الكامل',
            'bookingName': 'الاسم الكامل',
            'bookingPhone': 'رقم الهاتف',
            'bookingEmail': 'البريد الإلكتروني',
            'bookingNotes': 'طلبات خاصة (اختياري)',
            'profileFullName': 'الاسم الكامل',
            'profilePhone': 'رقم الهاتف',
            'profileEmailField': 'البريد الإلكتروني',
            'profileBio': 'أخبرنا عن نفسك...'
        };
        
        Object.entries(placeholders).forEach(([id, placeholder]) => {
            const element = document.getElementById(id);
            if (element) {
                if (this.currentLanguage === 'ar' && id === 'fullName') {
                    element.placeholder = placeholder;
                } else if (this.currentLanguage === 'en') {
                    element.placeholder = placeholder;
                }
            }
        });
    }

    updateValidationMessages() {
        // Update validation messages based on current language
        const messages = {
            en: {
                'selectHotel': 'Please select a hotel',
                'selectRoomDates': 'Please select room type and dates',
                'checkoutAfterCheckin': 'Check-out date must be after check-in date',
                'fillRequiredFields': 'Please fill in all required fields',
                'invalidEmail': 'Please enter a valid email address',
                'passwordTooShort': 'Password must be at least 6 characters long',
                'passwordsDoNotMatch': 'Passwords do not match',
                'invalidName': 'Please enter a valid full name (at least 2 characters)',
                'userExists': 'User already exists with this email',
                'invalidCredentials': 'Invalid email or password',
                'signUpSuccess': 'Account created successfully! Welcome!',
                'signInSuccess': 'Welcome back!',
                'signOutSuccess': 'Signed out successfully',
                'bookingConfirmed': 'Booking confirmed successfully!',
                'profileUpdated': 'Profile updated successfully!',
                'passwordUpdated': 'Password updated successfully!',
                'accountDeleted': 'Account deleted successfully',
                'bookingCancelled': 'Booking cancelled successfully'
            },
            ar: {
                'selectHotel': 'يرجى اختيار فندق',
                'selectRoomDates': 'يرجى اختيار نوع الغرفة والتواريخ',
                'checkoutAfterCheckin': 'يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول',
                'fillRequiredFields': 'يرجى ملء جميع الحقول المطلوبة',
                'invalidEmail': 'يرجى إدخال عنوان بريد إلكتروني صحيح',
                'passwordTooShort': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
                'passwordsDoNotMatch': 'كلمات المرور غير متطابقة',
                'invalidName': 'يرجى إدخال اسم كامل صحيح (حرفين على الأقل)',
                'userExists': 'يوجد مستخدم مسجل بهذا البريد الإلكتروني',
                'invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
                'signUpSuccess': 'تم إنشاء الحساب بنجاح! أهلاً وسهلاً!',
                'signInSuccess': 'أهلاً بعودتك!',
                'signOutSuccess': 'تم تسجيل الخروج بنجاح',
                'bookingConfirmed': 'تم تأكيد الحجز بنجاح!',
                'profileUpdated': 'تم تحديث الملف الشخصي بنجاح!',
                'passwordUpdated': 'تم تحديث كلمة المرور بنجاح!',
                'accountDeleted': 'تم حذف الحساب بنجاح',
                'bookingCancelled': 'تم إلغاء الحجز بنجاح'
            }
        };
        
        this.validationMessages = messages[this.currentLanguage];
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateEmailField(field) {
        const value = field.value.trim();
        const isValid = this.isValidEmail(value);
        this.setFieldValidation(field, isValid, this.validationMessages.invalidEmail);
        return isValid;
    }

    validatePasswordField(field) {
        const value = field.value;
        const isValid = value.length >= 6;
        this.setFieldValidation(field, isValid, this.validationMessages.passwordTooShort);
        return isValid;
    }

    validateConfirmPasswordField(field) {
        const value = field.value;
        const password = document.getElementById('password').value;
        const isValid = value === password;
        this.setFieldValidation(field, isValid, this.validationMessages.passwordsDoNotMatch);
        return isValid;
    }

    validateNameField(field) {
        const value = field.value.trim();
        const isValid = value.length >= 2;
        this.setFieldValidation(field, isValid, this.validationMessages.invalidName);
        return isValid;
    }

    setFieldValidation(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        let errorElement = formGroup.querySelector('.field-error');
        
        if (!isValid) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                formGroup.appendChild(errorElement);
            }
            errorElement.textContent = errorMessage;
            field.classList.add('error');
        } else {
            if (errorElement) {
                errorElement.remove();
            }
            field.classList.remove('error');
        }
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Authentication Methods
    showAuthModal(mode) {
        console.log(`🔐 Showing auth modal in ${mode} mode`);
        const modal = document.getElementById('authModal');
        const title = document.getElementById('modalTitle');
        const submitText = document.getElementById('submitText');
        const switchText = document.getElementById('switchText');
        const switchBtn = document.getElementById('switchMode');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const nameGroup = document.getElementById('nameGroup');
        
        if (!modal) {
            console.error('❌ Auth modal not found');
            return;
        }
        
        if (mode === 'signin') {
            title.setAttribute('data-en', 'Sign In');
            title.setAttribute('data-ar', 'تسجيل الدخول');
            title.textContent = this.currentLanguage === 'ar' ? 'تسجيل الدخول' : 'Sign In';
            
            submitText.setAttribute('data-en', 'Sign In');
            submitText.setAttribute('data-ar', 'تسجيل الدخول');
            submitText.textContent = this.currentLanguage === 'ar' ? 'تسجيل الدخول' : 'Sign In';
            
            switchText.setAttribute('data-en', "Don't have an account?");
            switchText.setAttribute('data-ar', 'ليس لديك حساب؟');
            switchText.textContent = this.currentLanguage === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?";
            
            switchBtn.setAttribute('data-en', 'Sign Up');
            switchBtn.setAttribute('data-ar', 'إنشاء حساب');
            switchBtn.textContent = this.currentLanguage === 'ar' ? 'إنشاء حساب' : 'Sign Up';
            
            confirmPasswordGroup.style.display = 'none';
            nameGroup.style.display = 'none';
        } else {
            title.setAttribute('data-en', 'Sign Up');
            title.setAttribute('data-ar', 'إنشاء حساب');
            title.textContent = this.currentLanguage === 'ar' ? 'إنشاء حساب' : 'Sign Up';
            
            submitText.setAttribute('data-en', 'Sign Up');
            submitText.setAttribute('data-ar', 'إنشاء حساب');
            submitText.textContent = this.currentLanguage === 'ar' ? 'إنشاء حساب' : 'Sign Up';
            
            switchText.setAttribute('data-en', 'Already have an account?');
            switchText.setAttribute('data-ar', 'لديك حساب بالفعل؟');
            switchText.textContent = this.currentLanguage === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?';
            
            switchBtn.setAttribute('data-en', 'Sign In');
            switchBtn.setAttribute('data-ar', 'تسجيل الدخول');
            switchBtn.textContent = this.currentLanguage === 'ar' ? 'تسجيل الدخول' : 'Sign In';
            
            confirmPasswordGroup.style.display = 'block';
            nameGroup.style.display = 'block';
        }
        
        this.showModal('authModal');
    }

    switchAuthMode() {
        const title = document.getElementById('modalTitle');
        const isSignIn = title.textContent === 'Sign In' || title.textContent === 'تسجيل الدخول';
        this.showAuthModal(isSignIn ? 'signup' : 'signin');
    }

    handleAuth(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (this.currentLanguage === 'ar' ? 'جاري المعالجة...' : 'Processing...');
        submitBtn.disabled = true;
        
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const fullName = formData.get('fullName');
        const title = document.getElementById('modalTitle');
        const isSignUp = title.textContent === 'Sign Up' || title.textContent === 'إنشاء حساب';
        
        // Enhanced validation
        if (!email || !password) {
            this.resetFormButton(submitBtn, originalText);
            this.showNotification(this.validationMessages.fillRequiredFields, 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.resetFormButton(submitBtn, originalText);
            this.showNotification(this.validationMessages.invalidEmail, 'error');
            return;
        }
        
        if (password.length < 6) {
            this.resetFormButton(submitBtn, originalText);
            this.showNotification(this.validationMessages.passwordTooShort, 'error');
            return;
        }
        
        if (isSignUp) {
            if (password !== confirmPassword) {
                this.resetFormButton(submitBtn, originalText);
                this.showNotification(this.validationMessages.passwordsDoNotMatch, 'error');
                return;
            }
            if (!fullName || fullName.trim().length < 2) {
                this.resetFormButton(submitBtn, originalText);
                this.showNotification(this.validationMessages.invalidName, 'error');
                return;
            }
            this.signUp(email, password, fullName);
        } else {
            this.signIn(email, password);
        }
        
        // Reset button after a delay
        setTimeout(() => {
            this.resetFormButton(submitBtn, originalText);
        }, 2000);
    }

    resetFormButton(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }

    signUp(email, password, fullName) {
        const existingUser = this.users.find(user => user.email === email);
        if (existingUser) {
            this.showNotification(this.validationMessages.userExists, 'error');
            return;
        }
        
        const newUser = {
            id: Date.now().toString(),
            email: email.toLowerCase().trim(),
            password,
            fullName: fullName.trim(),
            phone: '',
            bio: '',
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        this.currentUser = newUser;
        this.updateAuthUI();
        this.hideModal('authModal');
        this.showNotification(this.validationMessages.signUpSuccess, 'success');
    }

    signIn(email, password) {
        const user = this.users.find(u => u.email === email.toLowerCase().trim() && u.password === password);
        if (!user) {
            this.showNotification(this.validationMessages.invalidCredentials, 'error');
            return;
        }
        
        this.currentUser = user;
        this.updateAuthUI();
        this.hideModal('authModal');
        this.showNotification(this.validationMessages.signInSuccess, 'success');
    }

    signOut() {
        this.currentUser = null;
        this.updateAuthUI();
        this.showNotification(this.validationMessages.signOutSuccess, 'success');
    }

    updateAuthUI() {
        const signInBtn = document.getElementById('signInBtn');
        const signUpBtn = document.getElementById('signUpBtn');
        
        if (this.currentUser) {
            signInBtn.textContent = this.currentUser.fullName;
            signUpBtn.textContent = 'Sign Out';
        } else {
            signInBtn.textContent = 'Sign In';
            signUpBtn.textContent = 'Sign Up';
        }
    }

    handleSignInButtonClick() {
        // If user is logged in, open dashboard; otherwise open sign-in modal
        if (this.currentUser) {
            // Ensure any other modals are hidden
            this.hideModal('authModal');
            this.showDashboard();
        } else {
            this.showAuthModal('signin');
        }
    }

    handleSignUpButtonClick() {
        // If user is logged in, treat as sign out; otherwise open sign-up modal
        if (this.currentUser) {
            this.hideModal('authModal');
            this.signOut();
        } else {
            this.showAuthModal('signup');
        }
    }

    checkAuthState() {
        // Check if user is already signed in (in a real app, this would be handled by tokens)
        this.updateAuthUI();
    }

    // Data loading from backend
    async loadBackendData() {
        try {
            const [hotelsRes, roomsRes] = await Promise.all([
                fetch(`${this.apiBase}/api/hotels`),
                fetch(`${this.apiBase}/api/rooms`)
            ]);

            if (!hotelsRes.ok || !roomsRes.ok) {
                throw new Error('Failed to load data from backend');
            }

            const [hotels, rooms] = await Promise.all([
                hotelsRes.json(),
                roomsRes.json()
            ]);

            this.hotels = Array.isArray(hotels) ? hotels : [];
            this.rooms = Array.isArray(rooms) ? rooms : [];

            this.renderHotels();
            this.renderRoomOptions(this.bookingData.hotelId);
        } catch (error) {
            console.error('Error loading backend data:', error);
            const msg = this.currentLanguage === 'ar'
                ? 'تعذر تحميل الفنادق والغرف. يرجى تشغيل الخادم.'
                : 'Could not load hotels/rooms. Start the backend.';
            this.showNotification(msg, 'error');
        }
    }

    renderHotels() {
        const grid = document.getElementById('hotelsGrid');
        const options = document.getElementById('hotelOptions');

        const computePrice = (hotelId) => {
            const hotelRooms = this.rooms.filter(r => r.hotelId === hotelId && r.status === 'available');
            if (!hotelRooms.length) return null;
            return Math.min(...hotelRooms.map(r => r.price));
        };

        const translateName = (name) => {
            if (this.currentLanguage === 'ar' && this.translations.hotels[name]) {
                return this.translations.hotels[name];
            }
            return name;
        };

        const translateLocation = (location) => {
            if (this.currentLanguage === 'ar' && this.translations.locations[location]) {
                return this.translations.locations[location];
            }
            return location;
        };

        const priceLabel = (starting) => {
            if (!starting) return this.currentLanguage === 'ar' ? 'محجوز بالكامل' : 'Fully booked';
            return this.currentLanguage === 'ar'
                ? `بدءًا من $${starting} /ليلة`
                : `From $${starting}/night`;
        };

        if (grid) {
            if (!this.hotels.length) {
                grid.innerHTML = this.currentLanguage === 'ar'
                    ? '<p class="text-center text-gray-500">لا توجد فنادق متاحة حاليًا.</p>'
                    : '<p class="text-center text-gray-500">No hotels available right now.</p>';
            } else {
                grid.innerHTML = this.hotels.map(hotel => {
                    const starting = computePrice(hotel.id);
                    return `
                        <div class="hotel-card" data-hotel-id="${hotel.id}">
                            <div class="hotel-content">
                                <h3>${translateName(hotel.name)}</h3>
                                <p class="hotel-location">${translateLocation(hotel.location)}</p>
                                <div class="hotel-price">
                                    <span class="price">${priceLabel(starting)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                grid.querySelectorAll('.hotel-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const id = Number(card.dataset.hotelId);
                        this.showBookingModal();
                        setTimeout(() => this.selectHotelById(id), 50);
                    });
                });
            }
        }

        if (options) {
            if (!this.hotels.length) {
                options.innerHTML = this.currentLanguage === 'ar'
                    ? '<p class="text-center text-gray-500">لا توجد فنادق متاحة للحجز.</p>'
                    : '<p class="text-center text-gray-500">No hotels available to book.</p>';
            } else {
                options.innerHTML = this.hotels.map(hotel => {
                    const starting = computePrice(hotel.id);
                    return `
                        <div class="hotel-option" data-hotel-id="${hotel.id}">
                            <div class="hotel-option-info">
                                <h4>${translateName(hotel.name)}</h4>
                                <p>${translateLocation(hotel.location)}</p>
                                <span class="price">${priceLabel(starting)}</span>
                            </div>
                        </div>
                    `;
                }).join('');

                options.querySelectorAll('.hotel-option').forEach(option => {
                    option.addEventListener('click', () => this.selectHotel(option));
                });
            }
        }
    }

    renderRoomOptions(hotelId) {
        const container = document.getElementById('roomOptions');
        if (!container) return;

        const availableRooms = this.rooms
            .filter(r => (!hotelId || r.hotelId === Number(hotelId)) && r.status === 'available');

        if (!availableRooms.length) {
            container.innerHTML = this.currentLanguage === 'ar'
                ? '<p class="text-center text-gray-500">لا توجد غرف متاحة لهذا الفندق.</p>'
                : '<p class="text-center text-gray-500">No available rooms for this hotel.</p>';
            return;
        }

        container.innerHTML = availableRooms.map(room => `
            <div class="room-option" data-room-id="${room.id}">
                <div class="room-info">
                    <h4>${this.currentLanguage === 'ar' && this.translations.rooms[room.type] ? this.translations.rooms[room.type] : room.type}</h4>
                    <p>${this.currentLanguage === 'ar' ? 'غرفة مريحة' : 'Comfortable room'}</p>
                    <span class="room-price">${this.currentLanguage === 'ar' ? `$${room.price} /ليلة` : `$${room.price}/night`}</span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.room-option').forEach(option => {
            option.addEventListener('click', () => this.selectRoom(option));
        });
    }

    // Booking Methods
    showBookingModal() {
        console.log('📅 Showing booking modal');
        if (!this.currentUser) {
            console.log('👤 User not logged in, showing auth modal');
            this.showAuthModal('signin');
            return;
        }
        
        if (!this.hotels.length || !this.rooms.length) {
            this.loadBackendData();
        }
        this.resetBookingData();
        this.showModal('bookingModal');
        console.log('✅ Booking modal displayed');
    }

    resetBookingData() {
        this.currentStep = 1;
        this.bookingData = {
            hotelId: null,
            roomId: null,
            checkInDate: null,
            checkOutDate: null,
            name: this.currentUser?.fullName || '',
            phone: '',
            email: this.currentUser?.email || '',
            notes: ''
        };
        this.updateBookingSteps();
        this.updateBookingForm();
    }

    selectHotel(option) {
        document.querySelectorAll('.hotel-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        const hotelId = Number(option.dataset.hotelId);
        this.bookingData.hotelId = hotelId;
        this.bookingData.roomId = null;
        this.renderRoomOptions(hotelId);
    }

    selectHotelById(hotelId) {
        this.bookingData.hotelId = hotelId;
        this.bookingData.roomId = null;
        const option = document.querySelector(`.hotel-option[data-hotel-id="${hotelId}"]`);
        if (option) {
            this.selectHotel(option);
        } else {
            this.renderRoomOptions(hotelId);
        }
    }

    selectRoom(option) {
        document.querySelectorAll('.room-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        const roomId = Number(option.dataset.roomId);
        this.bookingData.roomId = roomId;
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.currentStep++;
            this.updateBookingSteps();
            this.updateBookingForm();
            this.updateSummary();
        }
    }

    prevStep() {
        this.currentStep--;
        this.updateBookingSteps();
        this.updateBookingForm();
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.bookingData.hotelId) {
                    this.showNotification(this.validationMessages.selectHotel, 'error');
                    return false;
                }
                break;
            case 2:
                if (!this.bookingData.roomId || !this.bookingData.checkInDate || !this.bookingData.checkOutDate) {
                    this.showNotification(this.validationMessages.selectRoomDates, 'error');
                    return false;
                }
                if (new Date(this.bookingData.checkInDate) >= new Date(this.bookingData.checkOutDate)) {
                    this.showNotification(this.validationMessages.checkoutAfterCheckin, 'error');
                    return false;
                }
                break;
            case 3:
                const name = document.getElementById('bookingName').value;
                const phone = document.getElementById('bookingPhone').value;
                const email = document.getElementById('bookingEmail').value;
                
                if (!name || !phone || !email) {
                    this.showNotification(this.validationMessages.fillRequiredFields, 'error');
                    return false;
                }
                
                this.bookingData.name = name;
                this.bookingData.phone = phone;
                this.bookingData.email = email;
                this.bookingData.notes = document.getElementById('bookingNotes').value;
                break;
        }
        return true;
    }

    updateBookingSteps() {
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            } else if (index + 1 < this.currentStep) {
                step.classList.add('completed');
            }
        });
        
        // Show/hide steps
        document.querySelectorAll('.booking-step').forEach((step, index) => {
            step.style.display = index + 1 === this.currentStep ? 'block' : 'none';
        });
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        const confirmBtn = document.getElementById('confirmBooking');
        
        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        
        if (this.currentStep < 4) {
            nextBtn.style.display = 'block';
            confirmBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'none';
            confirmBtn.style.display = 'block';
        }
    }

    updateBookingForm() {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('checkInDate').min = today;
        document.getElementById('checkOutDate').min = today;
        
        // Pre-fill user data if available
        if (this.currentUser) {
            document.getElementById('bookingName').value = this.currentUser.fullName;
            document.getElementById('bookingEmail').value = this.currentUser.email;
        }
    }

    onDateChange() {
        const checkInDate = document.getElementById('checkInDate').value;
        const checkOutDate = document.getElementById('checkOutDate').value;
        
        this.bookingData.checkInDate = checkInDate;
        this.bookingData.checkOutDate = checkOutDate;
        
        // Update check-out minimum date based on check-in
        if (checkInDate) {
            const nextDay = new Date(checkInDate);
            nextDay.setDate(nextDay.getDate() + 1);
            document.getElementById('checkOutDate').min = nextDay.toISOString().split('T')[0];
        }
    }

    updateSummary() {
        const hotel = this.hotels.find(h => h.id === this.bookingData.hotelId);
        const room = this.rooms.find(r => r.id === this.bookingData.roomId);
        
        // Calculate nights
        const nights = this.bookingData.checkInDate && this.bookingData.checkOutDate ? 
            Math.ceil((new Date(this.bookingData.checkOutDate) - new Date(this.bookingData.checkInDate)) / (1000 * 60 * 60 * 24)) : 0;
        
        // Calculate total
        const roomPrice = room ? room.price : 0;
        const total = roomPrice * nights;
        
        const translatedHotel = hotel ? (this.currentLanguage === 'ar' && this.translations.hotels[hotel.name] ? this.translations.hotels[hotel.name] : hotel.name) : '-';
        const translatedRoom = room ? (this.currentLanguage === 'ar' && this.translations.rooms[room.type] ? this.translations.rooms[room.type] : room.type) : '-';

        document.getElementById('summaryHotel').textContent = translatedHotel;
        document.getElementById('summaryRoom').textContent = translatedRoom;
        document.getElementById('summaryCheckIn').textContent = this.bookingData.checkInDate || '-';
        document.getElementById('summaryCheckOut').textContent = this.bookingData.checkOutDate || '-';
        document.getElementById('summaryNights').textContent = nights || '-';
        document.getElementById('summaryName').textContent = this.bookingData.name || '-';
        document.getElementById('summaryPhone').textContent = this.bookingData.phone || '-';
        document.getElementById('summaryEmail').textContent = this.bookingData.email || '-';
        document.getElementById('summaryTotal').textContent = `$${total}`;
    }

    handleBookingSubmit(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStep()) return;
        
        const room = this.rooms.find(r => r.id === this.bookingData.roomId);
        const nights = Math.ceil((new Date(this.bookingData.checkOutDate) - new Date(this.bookingData.checkInDate)) / (1000 * 60 * 60 * 24));

        const total = (room ? room.price : 0) * nights;

        const payload = {
            roomId: this.bookingData.roomId,
            guestName: this.bookingData.name,
            checkIn: this.bookingData.checkInDate,
            checkOut: this.bookingData.checkOutDate
        };

        fetch(`${this.apiBase}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Booking failed');
            }

            const booking = {
                id: data.booking?.id || Date.now().toString(),
                userId: this.currentUser.id,
                ...this.bookingData,
                status: 'confirmed',
                createdAt: new Date().toISOString(),
                total: total,
                nights: nights
            };
            
            this.bookings.push(booking);
            localStorage.setItem('bookings', JSON.stringify(this.bookings));
            
            this.hideModal('bookingModal');
            this.showNotification(this.validationMessages.bookingConfirmed, 'success');
            this.loadUserBookings();
            this.loadBackendData();
        }).catch((error) => {
            console.error('Booking failed:', error);
            this.showNotification(error.message || 'Booking failed', 'error');
        });
    }

    // Dashboard Methods
    showDashboard() {
        this.loadUserBookings();
        this.showModal('dashboardModal');
    }

    loadUserBookings() {
        if (!this.currentUser) return;
        
        const userBookings = this.bookings.filter(booking => booking.userId === this.currentUser.id);
        const upcoming = userBookings.filter(booking => 
            new Date(booking.checkInDate || booking.checkIn) >= new Date() && booking.status !== 'cancelled'
        );
        const history = userBookings.filter(booking => 
            new Date(booking.checkInDate || booking.checkIn) < new Date() || booking.status === 'cancelled'
        );
        
        this.renderBookings(upcoming, 'upcomingBookings');
        this.renderBookings(history, 'historyBookings');
    }

    renderBookings(bookings, containerId) {
        const container = document.getElementById(containerId);
        
        if (bookings.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">No bookings found</p>';
            return;
        }
        
        container.innerHTML = bookings.map(booking => this.createBookingCard(booking)).join('');
    }

    createBookingCard(booking) {
        const hotel = this.hotels.find(h => h.id === booking.hotelId);
        const room = this.rooms.find(r => r.id === booking.roomId);
        
        const statusClass = {
            confirmed: 'confirmed',
            pending: 'pending',
            cancelled: 'cancelled'
        }[booking.status] || 'pending';
        
        return `
            <div class="booking-item-card">
                <div class="booking-item-header">
                    <div class="booking-service">${hotel ? hotel.name : 'Unknown Hotel'}</div>
                    <div class="booking-status ${statusClass}">${booking.status}</div>
                </div>
                <div class="booking-details">
                    <div class="booking-detail">
                        <div class="booking-detail-label">Hotel</div>
                        <div class="booking-detail-value">${hotel ? hotel.name : 'Unknown'}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Room</div>
                        <div class="booking-detail-value">${room ? room.type : 'Unknown'}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Check-in</div>
                        <div class="booking-detail-value">${new Date(booking.checkInDate || booking.checkIn).toLocaleDateString()}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Check-out</div>
                        <div class="booking-detail-value">${new Date(booking.checkOutDate || booking.checkOut).toLocaleDateString()}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Nights</div>
                        <div class="booking-detail-value">${booking.nights || 0}</div>
                    </div>
                <div class="booking-detail">
                    <div class="booking-detail-label">Total</div>
                    <div class="booking-detail-value">$${booking.total}</div>
                </div>
            </div>
                ${booking.notes ? `<div class="booking-notes"><strong>${this.currentLanguage === 'ar' ? 'ملاحظات:' : 'Notes:'}</strong> ${booking.notes}</div>` : ''}
                <div class="booking-actions">
                ${booking.status === 'confirmed' && new Date(booking.checkInDate) > new Date() ? 
                    `<button class="btn btn-danger btn-sm" onclick="hotelBookingSystem.cancelBooking('${booking.id}')">Cancel</button>` : ''}
            </div>
            </div>
        `;
    }

    cancelBooking(bookingId) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            const booking = this.bookings.find(b => b.id === bookingId);
            if (booking) {
                booking.status = 'cancelled';
                localStorage.setItem('bookings', JSON.stringify(this.bookings));
                this.loadUserBookings();
                this.showNotification('Booking cancelled successfully', 'success');
            }
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Tab`).classList.add('active');
        
        // Load profile data when switching to profile tab
        if (tab === 'profile' && this.currentUser) {
            this.loadProfileData();
        }
    }

    // Profile Management Methods
    loadProfileData() {
        if (!this.currentUser) return;
        
        // Update profile header
        document.getElementById('profileName').textContent = this.currentUser.fullName;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        
        // Update profile form
        document.getElementById('profileFullName').value = this.currentUser.fullName || '';
        document.getElementById('profileEmailField').value = this.currentUser.email || '';
        document.getElementById('profilePhone').value = this.currentUser.phone || '';
        document.getElementById('profileBio').value = this.currentUser.bio || '';
        
        // Update profile stats
        const userBookings = this.bookings.filter(booking => booking.userId === this.currentUser.id);
        const totalSpent = userBookings.reduce((sum, booking) => sum + (booking.total || 0), 0);
        
        document.getElementById('totalBookings').textContent = userBookings.length;
        document.getElementById('totalSpent').textContent = `$${totalSpent}`;
    }

    handleProfileUpdate(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;
        
        const formData = new FormData(e.target);
        const updates = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            bio: formData.get('bio')
        };
        
        // Update user data
        const userIndex = this.users.findIndex(user => user.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.currentUser = this.users[userIndex];
            localStorage.setItem('users', JSON.stringify(this.users));
            
            // Update UI
            this.loadProfileData();
            this.updateAuthUI();
            
            this.showNotification(this.validationMessages.profileUpdated, 'success');
        }
    }

    showChangePasswordModal() {
        const currentPassword = prompt('Enter current password:');
        if (!currentPassword) return;
        
        if (currentPassword !== this.currentUser.password) {
            this.showNotification('Current password is incorrect', 'error');
            return;
        }
        
        const newPassword = prompt('Enter new password:');
        if (!newPassword) return;
        
        const confirmPassword = prompt('Confirm new password:');
        if (newPassword !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        // Update password
        const userIndex = this.users.findIndex(user => user.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex].password = newPassword;
            this.currentUser.password = newPassword;
            localStorage.setItem('users', JSON.stringify(this.users));
            this.showNotification(this.validationMessages.passwordUpdated, 'success');
        }
    }

    deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
        
        const confirmText = prompt('Type "DELETE" to confirm account deletion:');
        if (confirmText !== 'DELETE') {
            this.showNotification('Account deletion cancelled', 'error');
            return;
        }
        
        // Remove user and their bookings
        this.users = this.users.filter(user => user.id !== this.currentUser.id);
        this.bookings = this.bookings.filter(booking => booking.userId !== this.currentUser.id);
        
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('bookings', JSON.stringify(this.bookings));
        
        this.currentUser = null;
        this.updateAuthUI();
        this.hideModal('dashboardModal');
        this.showNotification(this.validationMessages.accountDeleted, 'success');
    }

    // Mobile Menu Methods
    toggleMobileMenu() {
        console.log('📱 Toggling mobile menu');
        const navMenu = document.getElementById('nav-menu');
        const hamburger = document.getElementById('hamburger');
        
        if (!navMenu || !hamburger) {
            console.error('❌ Mobile menu elements not found');
            return;
        }
        
        const isExpanded = navMenu.classList.contains('active');
        
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', !isExpanded);
        document.body.classList.toggle('nav-open', !isExpanded);
        
        // Close menu when clicking on a link
        if (!isExpanded) {
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                    document.body.classList.remove('nav-open');
                });
            });
        } else {
            document.body.classList.remove('nav-open');
        }
        
        console.log(`📱 Mobile menu ${!isExpanded ? 'opened' : 'closed'}`);
    }

    // Utility Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`❌ Modal with id '${modalId}' not found`);
            return;
        }
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log(`📋 Modal '${modalId}' shown`);
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`❌ Modal with id '${modalId}' not found`);
            return;
        }
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        console.log(`📋 Modal '${modalId}' hidden`);
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = 'auto';
    }

    hideNotification() {
        const notification = document.getElementById('successNotification');
        if (notification) {
            notification.classList.remove('show');
            // Force hide with inline styles as backup
            notification.style.display = 'none';
            // Reset display after a short delay to allow CSS to take over
            setTimeout(() => {
                notification.style.display = '';
            }, 100);
        }
    }

    showNotification(message, type = 'success') {
        try {
            console.log(`📢 Showing notification: ${message} (${type})`);
            const notification = document.getElementById('successNotification');
            if (!notification) {
                console.error('❌ Notification element not found');
                // Fallback to alert if notification element is missing
                alert(message);
                return;
            }
            
            const content = notification.querySelector('span');
            if (!content) {
                console.error('Notification content element not found');
                return;
            }
            
            // Set the notification message directly
            content.textContent = message;
            
            // Remove existing type classes
            notification.classList.remove('success', 'error', 'warning', 'info');
            
            if (type === 'error') {
                notification.style.background = '#ef4444';
                notification.querySelector('i').className = 'fas fa-exclamation-circle';
                notification.classList.add('error');
            } else if (type === 'warning') {
                notification.style.background = '#f59e0b';
                notification.querySelector('i').className = 'fas fa-exclamation-triangle';
                notification.classList.add('warning');
            } else if (type === 'info') {
                notification.style.background = '#3b82f6';
                notification.querySelector('i').className = 'fas fa-info-circle';
                notification.classList.add('info');
            } else {
                notification.style.background = '#10b981';
                notification.querySelector('i').className = 'fas fa-check-circle';
                notification.classList.add('success');
            }
            
            notification.classList.add('show');
            
            // Announce to screen readers
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            document.body.appendChild(announcement);
            
            setTimeout(() => {
                this.hideNotification();
                if (document.body.contains(announcement)) {
                    document.body.removeChild(announcement);
                }
            }, 4000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

}

// Initialize the hotel booking system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hotelBookingSystem = new HotelBookingSystem();
    
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add scroll effect to navbar with throttling for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
            const navbar = document.querySelector('.navbar');
            if (!navbar) return;

            // Keep the navbar solid (non-transparent) by using the CSS variable
            // This prevents the hero/video from showing through the top bar
            if (window.scrollY > 100) {
                navbar.style.background = 'var(--bg-card)';
                navbar.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.10)';
            } else {
                // Keep solid at the top as well so the bar is never transparent
                navbar.style.background = 'var(--bg-card)';
                navbar.style.boxShadow = 'none';
            }
        }, 10);
    });
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-slide-up');
            }
        });
    }, observerOptions);
    
    // Observe section headers for entry animations
    document.querySelectorAll('.section-header').forEach(el => {
        observer.observe(el);
    });
});

// Add some demo data for testing
if (!localStorage.getItem('users')) {
    const demoUsers = [
        {
            id: '1',
            email: 'demo@example.com',
            password: 'demo123',
            fullName: 'Demo User',
            createdAt: new Date().toISOString()
        }
    ];
    localStorage.setItem('users', JSON.stringify(demoUsers));
}

// Add some demo bookings (only if no bookings exist)
if (!localStorage.getItem('bookings')) {
    localStorage.setItem('bookings', JSON.stringify([]));
}
