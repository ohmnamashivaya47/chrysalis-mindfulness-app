<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# CHRYSALIS PRESENCE - Development Instructions

This is a mindfulness web application built with React 18, TypeScript, Vite, and Supabase.

## Project Philosophy
- Every interaction should feel intentional and peaceful
- Design with earthy minimalism inspired by Apple's clean design
- Create a digital sanctuary where technology serves consciousness
- Respect users' time and mental space

## Code Guidelines
- Use TypeScript strictly with proper type definitions
- Follow React best practices with hooks and functional components
- Implement accessibility features (WCAG 2.1 AA compliance)
- Use Tailwind CSS with the custom color palette:
  - Primary: Deep forest green (#1B4332)
  - Background: Warm beige (#F7F3E9)
  - Accent: Soft coral (#FF8A65)

## Component Structure
- All components should be in TypeScript with proper interfaces
- Use Framer Motion for smooth, intentional animations
- Implement proper error boundaries and loading states
- Follow the component structure defined in the src/ directory

## State Management
- Use Zustand for lightweight state management
- Implement stores for auth, presence, and community features
- Keep state minimal and focused

## Database Integration
- Use Supabase for backend services
- Implement real-time subscriptions for community features
- Follow the database schema defined in the project requirements
- Ensure all data handling is GDPR compliant and privacy-first

## Performance Requirements
- Lazy load all components where appropriate
- Implement virtual scrolling for large lists
- Use React.memo for expensive components
- Optimize bundle size with dynamic imports
- Implement service workers for offline functionality

## Key Features to Implement
1. Presence Detection System - monitor user behavior patterns
2. Micro-Moment Interventions - 2-10 second breathing reminders
3. Global Presence Network - real-time mindfulness activity visualization
4. Adaptive AI Personalization - learn individual patterns (client-side)
5. Progress & Community - track mindfulness sessions and connect with others

## Spiritual Integration
- Include daily wisdom quotes from verified spiritual teachers
- Implement gentle reminders about presence and impermanence
- Respect different spiritual traditions and practices
- Keep the tone warm, safe, and encouraging

When writing code for this project, prioritize creating a calming, mindful experience that helps users find moments of peace in their digital day.
