// Pricing Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const billingOptions = document.querySelectorAll('.billing-option');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');
    
    billingOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            billingOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Get billing type
            const billingType = this.getAttribute('data-billing');
            
            if (billingType === 'monthly') {
                // Show monthly prices, hide yearly
                monthlyPrices.forEach(price => price.style.display = 'block');
                yearlyPrices.forEach(price => price.style.display = 'none');
            } else {
                // Show yearly prices, hide monthly
                monthlyPrices.forEach(price => price.style.display = 'none');
                yearlyPrices.forEach(price => price.style.display = 'block');
            }
        });
    });
    
    // FAQ interaction (optional - for future enhancement)
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            // Could add expand/collapse functionality here
        });
    });
});