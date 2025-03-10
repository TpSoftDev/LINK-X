
/**
 * Animation utilities for creating smooth transitions and effects
 */

// Staggered animation for multiple elements
export const staggeredFadeIn = (delay = 0.1) => {
    return (index: number) => ({
      initial: { opacity: 0, y: 20 },
      animate: { 
        opacity: 1, 
        y: 0,
        transition: {
          delay: index * delay,
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1]
        }
      }
    });
  };
  
  // Intersection observer hook options
  export const observerOptions = {
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: "0px 0px -10% 0px"
  };
  
  // Subtle parallax effect calculations
  export const calculateParallax = (scrollY: number, factor = 0.2) => {
    return scrollY * factor;
  };
  
  // Smooth scroll to element
  export const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    window.scrollTo({
      top: element.offsetTop - 80, // Adjust for header height
      behavior: 'smooth'
    });
  };
  
  // Text reveal animation (character by character)
  export const textReveal = {
    hidden: { opacity: 0 },
    visible: (i = 0) => ({
      opacity: 1,
      transition: { 
        staggerChildren: 0.03, 
        delayChildren: i * 0.1 
      }
    })
  };
  
  export const letterAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };
  