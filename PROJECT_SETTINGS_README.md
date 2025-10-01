# RuchiAI Project Settings Page

A beautiful, modern project creation form inspired by Itch.io's project creation interface, designed with a white and purple theme and modern SaaS UI styling.

## Features

### 🎨 Design & UI
- **White & Purple Theme**: Clean, modern design with purple accents
- **Card-based Layout**: Each section is visually separated with rounded corners and subtle shadows
- **Responsive Design**: Fully responsive and mobile-optimized
- **Smooth Animations**: Framer Motion animations for smooth transitions
- **Sticky Sidebar**: Quick-jump navigation to each section

### 📝 Form Sections

#### 1. Project Basics
- Project title input with validation
- Project URL with slug-style formatting and validation
- Short description/tagline input

#### 2. Classification
- Project type selection (Games)
- Kind of project dropdown (Downloadable, HTML5/Web playable, Hybrid)
- Release status dropdown (Released, In Development, Prototype, Cancelled)

#### 3. Pricing
- Free/Donation/Paid options
- Suggested donation amount input for donation option
- Clear pricing information and warnings

#### 4. Uploads
- Drag & drop file upload area
- Multiple upload options (Computer, Dropbox, External link)
- File size limit display (1GB default)
- Butler integration hints

#### 5. Details
- Rich text description area
- Genre selection dropdown
- Tags system with smart autocomplete (up to 10 tags)
- AI disclosure radio buttons

#### 6. App Store Links
- Input fields for Steam, Apple App Store, Google Play, Amazon, Windows Store
- Custom noun override input

#### 7. Community
- Toggle options for community features
- Comments or Discussion board options

#### 8. Visibility & Access
- Draft, Restricted, or Public visibility options
- Helper text explaining each access mode

#### 9. Media
- Cover image upload with preview (min 315x250, recommended 630x500)
- Gameplay trailer URL input (YouTube/Vimeo)
- Screenshots upload (3-5 recommended)

### ⚡ Technical Features

#### Form Validation
- Real-time validation with inline error messages
- URL slug validation (lowercase, numbers, hyphens only)
- Required field validation
- File type and size validation

#### State Management
- Comprehensive form state management
- File upload handling with previews
- Tag management with add/remove functionality
- Error state management

#### User Experience
- Smooth scroll navigation between sections
- Visual feedback for all interactions
- Loading states for form submission
- Beautiful hover effects and transitions

## File Structure

```
src/app/dashboard/projects/new/
├── page.js                    # Main component
├── project-settings.module.css # Styles
└── README.md                  # Documentation

src/app/demo/project-settings/
└── page.js                    # Demo page
```

## Usage

### Basic Usage
```jsx
import ProjectSettingsPage from './dashboard/projects/new/page';

export default function MyPage() {
  return <ProjectSettingsPage />;
}
```

### Demo Page
Visit `/demo/project-settings` to see the page in action.

## Styling

The page uses CSS Modules with a comprehensive design system:

- **Colors**: White background with purple (#8a2be2) and blue (#667eea) gradients
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: Consistent spacing using rem units
- **Shadows**: Subtle shadows for depth and hierarchy
- **Borders**: Rounded corners (8px-16px) for modern look
- **Transitions**: Smooth 0.3s ease transitions throughout

## Form Data Structure

```javascript
const formData = {
  // Project Basics
  title: '',
  url: '',
  description: '',
  
  // Classification
  projectType: 'games',
  kindOfProject: 'downloadable',
  releaseStatus: 'released',
  
  // Pricing
  pricingType: 'free',
  suggestedDonation: 2.00,
  
  // Details
  fullDescription: '',
  genre: '',
  tags: [],
  aiDisclosure: 'no',
  
  // App Store Links
  steamLink: '',
  appleStoreLink: '',
  googlePlayLink: '',
  amazonLink: '',
  windowsStoreLink: '',
  
  // Custom Noun
  customNoun: '',
  
  // Community
  communityEnabled: false,
  communityType: 'comments',
  
  // Visibility
  visibility: 'draft',
  
  // Media
  coverImage: null,
  trailerLink: '',
  screenshots: []
};
```

## Dependencies

- React 19.1.0
- Next.js 15.5.2
- Framer Motion (for animations)
- React Icons (for icons)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] Rich text editor integration
- [ ] File upload progress indicators
- [ ] Auto-save functionality
- [ ] Form validation with Yup or Zod
- [ ] Integration with actual backend APIs
- [ ] Drag & drop reordering for screenshots
- [ ] Image cropping for cover images
- [ ] Preview mode for the project

## Contributing

When making changes to this component:

1. Maintain the white & purple theme
2. Ensure all form validations work correctly
3. Test responsive design on mobile devices
4. Keep animations smooth and purposeful
5. Update this README if adding new features

## License

This component is part of the RuchiAI project and follows the same licensing terms.
