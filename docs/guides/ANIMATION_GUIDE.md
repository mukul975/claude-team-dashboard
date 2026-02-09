# Animation System Guide

Professional animation system for Claude Agent Dashboard following the 12 Principles of Animation.

## Quick Start

The animation system is automatically imported in `src/main.jsx`. Simply add animation classes to your components.

## Animation Classes Reference

### Entrance Animations

```jsx
// Fade in with scale (recommended for cards)
<div className="card-animated">...</div>

// Slide in from right (activity feed)
<div className="activity-item-animated">...</div>

// Bounce in (attention-grabbing)
<div className="animate-bounce-in">...</div>

// Fade in up (general purpose)
<div className="animate-fade-in-up">...</div>

// Fade in down (top elements)
<div className="animate-fade-in-down">...</div>

// Zoom in (quick entrance)
<div className="animate-zoom-in">...</div>
```

### Card Animations

```jsx
// Stat cards with staggered entrance
<div className="stat-card-animated">
  {/* Automatically staggers based on :nth-child */}
</div>

// General card with animation
<div className="card-animated">
  {/* Smooth fade-in-scale entrance */}
</div>

// Team card with hover effect
<div className="team-card-animated">
  {/* Hover lifts card up */}
</div>

// Agent card with hover effect
<div className="agent-card-animated">
  {/* Hover scales card */}
</div>
```

### Button & Interactive Elements

```jsx
// Animated button with hover/active states
<button className="button-animated">
  Click me
</button>

// Button with ripple effect
<button className="button-animated button-ripple">
  Ripple effect
</button>

// Hover lift effect
<div className="hover-lift">
  {/* Lifts on hover with shadow */}
</div>

// Hover scale effect
<div className="hover-scale">
  {/* Scales to 1.05x on hover */}
</div>

// Hover glow effect
<div className="hover-glow-orange">
  {/* Orange glow on hover */}
</div>
```

### Badge Animations

```jsx
// Animated badge with pop-in
<span className="badge badge-animated">
  Status
</span>

// Badge with shimmer effect (for in-progress)
<span className="badge badge-in-progress badge-shimmer">
  In Progress
</span>
```

### Live Indicators

```jsx
// Default live indicator (10px)
<span className="live-indicator"></span>

// Small live indicator (6px)
<span className="live-indicator live-indicator-sm"></span>

// Large live indicator (14px)
<span className="live-indicator live-indicator-lg"></span>
```

### Icon Animations

```jsx
// Hover scale + rotate
<div className="icon-hover">
  <Icon />
</div>

// Spin on hover
<div className="icon-spin-hover">
  <Icon />
</div>

// Bounce on hover
<div className="icon-bounce-hover">
  <Icon />
</div>
```

### Task List Animations

```jsx
// Task item with fade-in and hover effect
<div className="task-item-animated">
  {/* Fades in and slides right on hover */}
</div>

// Task status indicators
<span className="task-status-pending">Pending</span>
<span className="task-status-in-progress">In Progress</span>
<span className="task-status-completed">Completed</span>
```

### Loading States

```jsx
// Skeleton loader
<div className="skeleton-animated" style={{width: '100%', height: '20px'}} />

// Loading dots
<div className="loading-dots">
  <span></span>
  <span></span>
  <span></span>
</div>

// Loading spinner
<div className="loading-spinner">
  <Icon />
</div>
```

### Progress Bars

```jsx
// Animated progress bar
<div className="progress-bar-animated">
  <div className="progress-fill-animated" style={{width: '60%'}} />
</div>

// Indeterminate progress
<div className="progress-bar-animated progress-indeterminate">
  <div className="progress-fill-animated" style={{width: '100%'}} />
</div>
```

### Number Counters

```jsx
// Animated counter (bounces when value changes)
<span className="counter-animated updated">
  {value}
</span>
```

### Connection Status

```jsx
// Connected status
<div className="connection-connected">
  Connected
</div>

// Connecting status
<div className="connection-connecting">
  Connecting...
</div>

// Error status
<div className="connection-error">
  Connection Error
</div>
```

### Utility Animations

```jsx
// Continuous animations
<div className="animate-pulse">...</div>
<div className="animate-spin">...</div>
<div className="animate-glow-pulse">...</div>
<div className="animate-orange-glow">...</div>
<div className="animate-float">...</div>
<div className="animate-heartbeat">...</div>

// One-time animations
<div className="animate-shake">...</div> // Trigger on error
```

## Staggered Animations

Cards and list items automatically stagger based on `:nth-child()`:

```jsx
{items.map((item, index) => (
  <div key={index} className="card-animated">
    {/* Each card animates 50ms after the previous */}
  </div>
))}
```

Stagger delays:
- `card-animated`: 0-350ms (50ms intervals)
- `stat-card-animated`: 0-250ms (50ms intervals)
- `activity-item-animated`: 0-360ms (60ms intervals)

## Animation Timing

All animations use professional easing curves:

- **Ease Out** `cubic-bezier(0.4, 0.0, 0.2, 1)` - For entrances
- **Ease In** `cubic-bezier(0.4, 0.0, 1, 1)` - For exits
- **Bounce** `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - For attention

### Duration Guidelines

- **Micro-interactions**: 150-250ms (hover, active states)
- **UI transitions**: 300-400ms (cards, badges)
- **Page transitions**: 400-600ms (major state changes)
- **Attention**: 500-1000ms (success, celebration)

## Performance

All animations use GPU-accelerated properties:
- `transform` (translate, scale, rotate)
- `opacity`

Avoid animating:
- `width`, `height` (causes reflow)
- `top`, `left`, `margin` (causes reflow)

## Accessibility

The animation system fully respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations become instant */
  /* Infinite animations are disabled */
}
```

Users who prefer reduced motion will still see state changes but without the animation.

## Best Practices

1. **Don't overanimate**: Use animations purposefully
2. **Respect hierarchy**: Important elements get more attention
3. **Stay consistent**: Use the same animation for similar elements
4. **Test performance**: Monitor frame rate on low-end devices
5. **Consider accessibility**: Always respect reduced motion preferences

## Examples

### Stat Card Grid

```jsx
<div className="grid grid-cols-6 gap-4">
  {stats.map((stat, index) => (
    <div key={index} className="stat-card stat-card-animated">
      <h3>{stat.label}</h3>
      <p className="counter-animated">{stat.value}</p>
    </div>
  ))}
</div>
```

### Activity Feed

```jsx
<div className="space-y-2">
  {activities.map((activity, index) => (
    <div key={index} className="activity-item-animated">
      <p>{activity.message}</p>
    </div>
  ))}
</div>
```

### Button with Ripple

```jsx
<button className="button-animated button-ripple bg-claude-orange">
  <span>Take Action</span>
</button>
```

### Live Connection Indicator

```jsx
<div className="flex items-center gap-2">
  <span className="live-indicator"></span>
  <span className="connection-connected">Connected</span>
</div>
```

## Customization

To create custom animations, extend the keyframes in `animations.css`:

```css
@keyframes myCustomAnimation {
  from { /* start state */ }
  to { /* end state */ }
}

.my-custom-class {
  animation: myCustomAnimation 0.5s ease-out;
}
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

All animations use standard CSS3 properties with excellent browser support.

---

For questions or custom animation needs, refer to the 12 Principles of Animation or consult the animation specialist agent.
