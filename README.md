# 🌟 Daily Habits Reminder - Wellness Tracker

A modern, mobile-first wellness reminder application built with Next.js 15+, designed to help users build and maintain healthy daily habits with intelligent notifications and comprehensive tracking.

## 🎯 Project Overview

The Daily Habits Reminder is a Progressive Web App (PWA) that empowers users to:
- Create and manage personalized wellness reminders
- Track habit completion with detailed analytics
- Receive smart notifications at optimal times
- Monitor progress with visual insights and streak tracking
- Access their wellness journey across all devices, even offline

## ✨ Features

### 🚀 Core Features
- **Smart Reminders**: Customizable reminders with quiet hours and frequency settings
- **Habit Tracking**: Complete logging system for all reminder interactions
- **Analytics Dashboard**: Visual insights into completion rates, streaks, and patterns
- **Counter System**: Track daily activities like water intake, coffee consumption
- **Mobile-Optimized**: Touch-friendly interface with swipe gestures and haptic feedback
- **Dark Mode**: Beautiful dark-first design optimized for mobile usage

### 📱 Progressive Web App
- **Offline Support**: Full functionality without internet connection
- **Install Anywhere**: Add to home screen on any device
- **Background Sync**: Seamless data synchronization when back online
- **Push Notifications**: Native-like notification experience

### 🔒 Security & Privacy
- **Local Data Storage**: All data stored locally with SQLite
- **JWT Authentication**: Secure authentication system
- **Privacy-First**: No external data sharing or tracking
- **Open Source**: Fully transparent and auditable codebase

## 🛠️ Tech Stack

### Frontend
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4.0+** - Utility-first styling with dark mode support
- **shadcn/ui** - Modern, accessible UI components
- **React Hook Form + Zod** - Form handling and validation

### Backend & Database
- **Prisma** - Type-safe database ORM
- **SQLite** - Lightweight, local database
- **JWT** - Secure authentication
- **API Routes** - Next.js server-side functionality

### Development & Quality
- **TypeScript** - Full type safety
- **ESLint** - Code linting and best practices
- **Jest + Testing Library** - Comprehensive testing
- **Playwright** - End-to-end testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/daily-habits-reminder.git
   cd daily-habits-reminder
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize the database**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   pnpm prisma db seed
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
daily-habits-reminder/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── reminders/      # Reminder management
│   │   ├── analytics/      # Analytics pages
│   │   ├── settings/       # Settings pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── forms/         # Form components
│   │   ├── charts/        # Chart components
│   │   └── layout/        # Layout components
│   ├── lib/               # Utility functions
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── prisma.ts      # Database connection
│   │   ├── validations.ts # Zod schemas
│   │   └── utils.ts       # General utilities
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── docs/                  # Documentation
└── __tests__/            # Test files
```

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Database
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema changes to database
pnpm db:seed      # Seed database with sample data
pnpm db:studio    # Open Prisma Studio

# Testing
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run end-to-end tests
```

### Development Guidelines

#### Code Style
- **Mobile-First**: Design for mobile screens first (375px width)
- **Dark Mode Only**: No light mode support needed
- **TypeScript**: Strict typing throughout
- **Component Strategy**: Use shadcn/ui components when available
- **Form Handling**: Always use React Hook Form with Zod validation

#### Styling Rules
- **Tailwind Only**: Use only Tailwind CSS utility classes
- **No Custom CSS**: Avoid custom CSS files (except globals.css)
- **Semantic Colors**: Use design system colors for consistency
- **Responsive Design**: Mobile-first with proper breakpoints

#### Security Best Practices
- **Environment Variables**: Use for all sensitive data
- **Input Validation**: Validate all user inputs with Zod
- **Authentication**: JWT with proper expiration
- **Error Handling**: Comprehensive error handling without data leaks

## 🎨 Design System

### Color Palette (Dark Mode)
- **Background**: `bg-background` - Deep slate tones
- **Cards**: `bg-card` - Elevated surfaces
- **Primary**: `bg-primary` - Primary actions
- **Success**: `text-green-400` - Completion states
- **Warning**: `text-amber-400` - Warning states
- **Error**: `text-destructive` - Error states

### Typography
- **Headings**: Font weights from medium to bold
- **Body**: `text-sm` for primary text
- **Secondary**: `text-muted-foreground` for less important text

## 🔄 Development Roadmap

The project follows a structured 7-phase development approach:

1. **Phase 1**: Project Foundation & Setup ✅
2. **Phase 2**: Core Reminder System 🚧
3. **Phase 3**: Data Tracking & Logging
4. **Phase 4**: Analytics & Advanced Features
5. **Phase 5**: Mobile Optimization & PWA
6. **Phase 6**: Testing & Quality Assurance
7. **Phase 7**: Deployment & Production

See [docs/ROADMAP.md](docs/ROADMAP.md) for detailed development phases.

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow the coding standards** outlined in `.cursorrules`
4. **Write tests** for new functionality
5. **Ensure all tests pass** (`pnpm test`)
6. **Submit a pull request**

### Code Quality Standards
- Use TypeScript with strict configuration
- Follow mobile-first responsive design
- Implement comprehensive error handling
- Add tests for new features
- Use conventional commit messages

## 🔒 Security

- **Local Data**: All user data stored locally
- **No Tracking**: No external analytics or tracking
- **Secure Authentication**: JWT-based authentication
- **Input Validation**: All inputs validated and sanitized
- **Open Source**: Full transparency and auditability

## 📖 Documentation

- [Development Roadmap](docs/ROADMAP.md) - Detailed development phases
- [Cursor Rules](.cursorrules) - Development guidelines and standards
- [API Documentation](docs/API.md) - API endpoints and usage
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React framework
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Prisma](https://prisma.io) - Next-generation ORM

---

**Built with ❤️ for better wellness habits**

For questions, suggestions, or support, please open an issue on GitHub.
