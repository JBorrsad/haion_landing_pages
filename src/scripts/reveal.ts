/**
 * Sistema de Reveal On Scroll - Nivel Senior
 * Animaciones diferenciadas para entrada/salida con timing perfecto
 * Un único IntersectionObserver compartido para máxima performance
 */

export function initRevealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');

    if (reveals.length === 0) return;

    // Track estado de cada elemento
    const elementStates = new WeakMap();

    // IntersectionObserver único y optimizado
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target;
                const wasVisible = elementStates.get(element);
                const delay = parseInt(element.getAttribute('data-delay') || '0');

                if (entry.isIntersecting) {
                    // Elemento entra en viewport
                    elementStates.set(element, true);

                    // Limpiar cualquier animación previa
                    element.classList.remove('is-leaving');

                    // Aplicar entrada con delay si existe
                    setTimeout(() => {
                        element.classList.add('is-entering');
                    }, delay);

                } else if (wasVisible) {
                    // Elemento sale del viewport (solo si ya había sido visible)
                    elementStates.set(element, false);

                    // Limpiar entrada y aplicar salida
                    element.classList.remove('is-entering');
                    element.classList.add('is-leaving');

                    // Limpiar clase de salida después de la animación
                    setTimeout(() => {
                        if (!elementStates.get(element)) {
                            element.classList.remove('is-leaving');
                        }
                    }, 300); // Ligeramente más que la duración de la animación
                }
            });
        },
        {
            threshold: 0.2, // 20% visible para activar (más confiable)
            rootMargin: '0px 0px -10% 0px' // Activar cuando esté entrando a la zona visible
        }
    );

    reveals.forEach((reveal) => {
        observer.observe(reveal);
    });

    // Cleanup para evitar memory leaks
    return () => {
        reveals.forEach((reveal) => observer.unobserve(reveal));
    };
}

// Auto-init con soporte para Astro View Transitions
if (typeof window !== 'undefined') {
    // Primera carga
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRevealOnScroll);
    } else {
        initRevealOnScroll();
    }

    // Re-init después de navegación
    document.addEventListener('astro:page-load', initRevealOnScroll);
}

