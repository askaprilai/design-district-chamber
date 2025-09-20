// Animated Questions for Ask April AI
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('animated-question');
    
    if (!input) return;
    
    const questions = [
        "How do I have a conversation with an underperforming employee?",
        "How do I stay positive when sales are down?",
        "How do I address a team member who's always negative?",
        "How do I have the conversation about a promotion denial?",
        "How do I motivate someone who seems checked out?",
        "How do I handle conflict between two team members?",
        "How do I give feedback without hurting feelings?",
        "How do I stay calm when a customer is yelling at me?",
        "How do I have a difficult conversation with my boss?",
        "How do I build confidence in a shy employee?"
    ];
    
    let currentQuestionIndex = 0;
    let currentCharIndex = 0;
    let isTyping = true;
    
    function typeText() {
        const currentQuestion = questions[currentQuestionIndex];
        
        if (isTyping) {
            // Typing phase
            if (currentCharIndex < currentQuestion.length) {
                input.value = currentQuestion.substring(0, currentCharIndex + 1);
                currentCharIndex++;
                setTimeout(typeText, 80); // Typing speed
            } else {
                // Pause at end of question
                setTimeout(() => {
                    isTyping = false;
                    currentCharIndex = currentQuestion.length;
                    typeText();
                }, 2000); // Pause duration
            }
        } else {
            // Deleting phase
            if (currentCharIndex > 0) {
                input.value = currentQuestion.substring(0, currentCharIndex - 1);
                currentCharIndex--;
                setTimeout(typeText, 40); // Deleting speed
            } else {
                // Move to next question
                currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
                isTyping = true;
                setTimeout(typeText, 500); // Pause before next question
            }
        }
    }
    
    // Start the animation
    typeText();
});