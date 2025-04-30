# **Jason Elgin's Portfolio**

Personal portfolio site 

# **Styling System Documentation**

## **Overview**

This portfolio uses the Once UI styling system, which is built on a combination of SCSS, CSS variables, and data attributes. This document explains how styles are structured and how to customize them.

## **Key Components of the Styling System**

### **1. Directory Structure**

```
src/
  ├── once-ui/
  │   ├── styles/            # Utility classes and style behaviors
  │   │   ├── index.scss     # Main import file
  │   │   ├── global.scss    # Global element styles
  │   │   ├── spacing.scss   # Margin and padding utilities
  │   │   ├── typography.scss # Text styling utilities
  │   │   └── ...
  │   │
  │   └── tokens/            # Design tokens and variables
  │       ├── index.scss     # Main import file
  │       ├── theme.scss     # Theme variables (dark/light modes)
  │       ├── scheme.scss    # Color schemes
  │       └── ...
  │
  └── app/
      └── resources/         # Site configuration
          └── config/        # Site-specific config including styles
```

### **2. Core Styling Technologies**

- **SCSS**: Used for styling with nested selectors and mixins
- **CSS Variables**: For theming and responsive design
- **Data Attributes**: For theme switching and style customization
- **PostCSS**: For processing styles with plugins (custom media queries, etc.)

### **3. Theming System**

The site uses a robust theming system with:

- **Light/Dark Modes**: Controlled via the `data-theme` attribute
- **Color Schemes**: Customizable brand, accent, and neutral colors 
- **Design Tokens**: CSS variables for consistent spacing, typography, colors

### **4. How Styles Are Applied**

1. Root styles are imported in `src/app/layout.tsx`
2. Theme tokens are set via data attributes:
   ```tsx
   <html
     data-neutral={style.neutral}
     data-brand={style.brand}
     data-accent={style.accent}
     data-solid={style.solid}
   >
   ```
3. Components use utility classes or inline style props:
   ```tsx
   <Flex 
     paddingY="l"
     backgroundColor="surface"
   >
   ```

### **5. Customization Options**

#### **Theme Customization**

Edit theme values in `src/app/resources/config/style.ts` to change:
- Color schemes (brand, accent, neutral)
- Border styles
- Surface appearances
- Transition effects

#### **Component Styling**

Once UI components accept style props directly:
- Spacing: `margin`, `padding`, `gap`
- Layout: `width`, `height`, `position`
- Visual: `background`, `color`, `border`

#### **Global Style Modifications**

To modify global styles:
1. Create a custom SCSS file in your project
2. Import it in `src/app/layout.tsx` after Once UI styles
3. Override CSS variables or add custom styles

#### **Responsive Design**

The system uses custom media queries defined in `breakpoints.scss`:
- Uses `@media` queries processed by PostCSS
- Components like `<Hide>` or `<Show>` for responsive visibility
- Responsive props (e.g., `paddingX={{ base: 's', md: 'l' }}`)

## **Example: Style Customization**

```tsx
// Modify theme values
// src/app/resources/config/style.ts
export const style = {
  neutral: "slate",    // Change neutral color scheme
  brand: "indigo",     // Change brand color
  accent: "orange",    // Change accent color
  border: "round",     // Change border radius style
  surface: "frosted",  // Change surface appearance
  // ...
};

// Add custom global styles
// src/app/custom-styles.scss
:root {
  --font-family-body: 'Your Custom Font', sans-serif;
  --page-background: #f9f9f9;
}

[data-theme="dark"] {
  --page-background: #121212;
}
```

**4. Edit config**
```
src/app/resources/config
```

**5. Edit content**
```
src/app/resources/content
```

**6. Create blog posts / projects**
```
Add a new .mdx file to src/app/blog/posts or src/app/work/projects
```

# **Documentation**

Docs available at: [docs.once-ui.com](https://docs.once-ui.com/docs/magic-portfolio/quick-start)

# **Features**

## **Once UI**
- All tokens, components & features of [Once UI](https://once-ui.com)

## **SEO**
- Automatic open-graph and X image generation with next/og
- Automatic schema and metadata generation based on the content file

## **Design**
- Responsive layout optimized for all screen sizes
- Timeless design without heavy animations and motion
- Endless customization options through [data attributes](https://once-ui.com/docs/theming)

## **Content**
- Render sections conditionally based on the content file
- Enable or disable pages for blog, work, gallery and about / CV
- Generate and display social links automatically
- Set up password protection for URLs

## **Localization**
- A localized version of Magic Portfolio is available with the next-intl library
- To use localization, switch to the 'i18n' branch.

See `LICENSE.txt` for more information.
