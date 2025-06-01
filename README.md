# 🦫 Datagotchi - Learn, Earn & Train AI with Your Personal Capybara

<div align="center">
  <img src="client/public/capybara/variants/default-capybara.png" alt="Datagotchi Capybara" width="200"/>
  
  [![World Mini App](https://img.shields.io/badge/World-Mini%20App-8B5CF6)](https://worldcoin.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-15-000000)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688)](https://fastapi.tiangolo.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 🌟 Overview

**Datagotchi** is a gamified learn-to-earn platform built as a World Mini App, where users create and nurture virtual capybara pets while contributing to AI training. By playing educational mini-games and building personal knowledge bases, users earn rewards while helping improve AI models. It's where data ownership meets fun!

### 🚀 The Big Picture

Imagine if you could:

- **Earn money** while playing fun educational games
- **Train your own AI assistant** that learns from your interests
- **Own your data** and get insights about your learning patterns
- **Help build ethical AI** by contributing verified human intelligence
- **Customize adorable capybaras** as you progress

That's Datagotchi - combining the best of NotebookLM's AI insights, Scale AI's data labeling, and Tamagotchi's pet nurturing into one revolutionary platform exclusive to World ID verified humans.

### 🎯 Key Features

- **🦫 Virtual Pet System** - Create and customize unique capybara pets with different rarities and traits
- **🎯 Educational Mini-Games** - Learn while earning through 4 different game types that help train AI
- **📚 Personal Knowledge Base** - Build and manage your own data collection with AI-powered insights
- **🤖 AI Assistant** - Chat with an AI that learns from your personal knowledge base
- **📊 Data Insights** - Visualize your learning progress and data contributions
- **🏆 Achievement System** - Unlock rewards and track your progress with XP and skill points
- **🌍 World ID Integration** - Secure, privacy-preserving authentication for verified humans

## 💡 Why Datagotchi?

### 🔄 The Virtuous Cycle

Datagotchi creates a unique ecosystem where everyone wins:

1. **Play & Learn** → Users enjoy educational mini-games while earning rewards
2. **Train AI** → Game data helps train AI models in a decentralized, ethical way
3. **Earn & Grow** → Users earn points to customize their capybaras and unlock features
4. **Get Insights** → AI becomes smarter and provides better personalized insights
5. **Repeat** → Better AI creates more engaging experiences, attracting more users

### 🧠 Your Personal AI Knowledge Companion

Similar to **NotebookLM**, but gamified and personalized:

- Build your own knowledge base through gameplay and direct uploads
- AI learns from YOUR data to provide personalized insights
- Ask questions about your collected knowledge and get intelligent responses
- Discover patterns and connections in your learning journey
- Own and control your data while contributing to AI advancement

### 🌐 Decentralized AI Training (Like Scale AI, but Better)

Traditional AI training platforms like Scale AI rely on centralized workforces. Datagotchi revolutionizes this:

- **Verified Humans Only** - World ID ensures every contribution comes from a real person
- **Quality Over Quantity** - Gamification ensures engaged, thoughtful responses
- **Fair Compensation** - Direct rewards for contributions, no middlemen
- **Data Ownership** - Users retain control of their data and insights
- **Global Participation** - Anyone with World ID can contribute and earn

### 🎯 Learn About Yourself

Datagotchi isn't just about training AI—it's about self-discovery:

- Track your learning patterns across different game types
- Visualize your knowledge growth over time
- Identify your strengths and interests through gameplay analytics
- Build a personalized AI that understands your unique perspective
- Create a digital legacy of your knowledge and insights

## 🚀 Live Demo

Experience Datagotchi as a World Mini App: [Coming Soon]

## 🏗️ Technical Architecture

### Frontend (Client)

Built with modern web technologies optimized for the World App environment:

- **Framework**: Next.js 15.3.3 with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom retro-pixel theme
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Context API with custom providers
- **Authentication**: World ID via MiniKit SDK
- **Database**: Supabase client SDK
- **Animations**: Motion library for smooth transitions

#### Key Frontend Features:

- Server-side rendering for optimal performance
- Responsive design optimized for mobile (World App)
- Pixel-art aesthetic with custom font (Silkscreen)
- Real-time data synchronization
- Progressive Web App capabilities

### Backend (API)

High-performance Python API with AI capabilities:

- **Framework**: FastAPI 0.111.0
- **Language**: Python 3.11+
- **AI/ML**:
  - OpenAI API for natural language processing
  - Notte SDK 1.4.4 for advanced ML operations
  - Custom embeddings for semantic search
- **Database**: Supabase (PostgreSQL)
- **Data Processing**: Pandas, NumPy, PyArrow
- **Image Processing**: Pillow
- **Dependency Management**: Poetry

#### API Endpoints:

- `/api/v1/auth/*` - World ID authentication
- `/api/v1/storage/*` - Pet data and knowledge management
- `/api/v1/ai/*` - AI inference and content generation
- `/api/v1/games/*` - Game mechanics and scoring

### Database Schema

PostgreSQL database via Supabase with the following key tables:

- `users` - World ID authenticated users
- `pets` - Virtual capybara pets with stats
- `knowledge` - User's knowledge base entries
- `instances` - Data instances from games
- `achievements` - User achievements and progress

## 🎮 Mini-Games

Each game serves a dual purpose: **educating users** while **generating valuable AI training data**. Here's how the magic happens:

### 1. 📸 Image Quality Judge

- **What You Do**: Select the highest quality image from 4 options
- **What You Learn**: Visual perception and quality assessment skills
- **How It Helps AI**: Trains computer vision models to understand human quality preferences
- **Your Benefit**: Earn 5 points per round + improve your Science skill
- **Real Impact**: Your choices help AI better understand aesthetics and image quality

### 2. 📚 Language Flashcards

- **What You Do**: Learn new words in different languages with AI-generated flashcards
- **What You Learn**: Expand vocabulary in multiple languages
- **How It Helps AI**: Validates and improves translation accuracy
- **Your Benefit**: Earn 8 points per session + boost your Social skill
- **Real Impact**: Your learning helps AI provide better translations for millions

### 3. 💭 Mood Detective

- **What You Do**: Identify the emotional tone of text messages
- **What You Learn**: Emotional intelligence and communication nuances
- **How It Helps AI**: Enhances sentiment analysis and emotional understanding
- **Your Benefit**: Earn 6 points per classification + develop your Code skill
- **Real Impact**: Your insights help AI better understand human emotions in text

### 4. 🏆 Knowledge Trivia

- **What You Do**: Answer trivia questions and learn interesting facts
- **What You Learn**: Expand general knowledge across various topics
- **How It Helps AI**: Validates factual accuracy and builds knowledge graphs
- **Your Benefit**: Earn 15 points per session + increase your Trivia skill
- **Real Impact**: Your answers help AI verify facts and combat misinformation

### 🎲 The Game Economy

```
You Play Games → Generate Training Data → AI Gets Smarter →
Better Personalized Insights → More Engaging Games → You Earn More
```

This creates a sustainable ecosystem where:

- **Users are fairly compensated** for their contributions
- **AI models improve** with verified human input
- **Data quality is ensured** through World ID verification
- **Everyone benefits** from collective intelligence

## 🦫 Pet System

### Rarities

- **Common** (Gray gem) - Basic capybaras
- **Rare** (Blue gem) - Special color variants
- **Epic** (Purple gem) - Unique traits
- **Legendary** (Orange gem) - Extremely rare

### Variants

- Default Brown
- Pink
- Blue
- Ice
- Black

### Skills

Each pet has 6 skill attributes:

- 🧪 **Science** - From image and data tasks
- 💻 **Code** - From technical challenges
- 👥 **Social** - From language learning
- 🧠 **Trivia** - From knowledge questions
- ⚔️ **Trenches** - From difficult tasks
- 🔥 **Streak** - From daily consistency

## 📊 Data Insights - Your Personal AI Knowledge Hub

### 🧠 Like NotebookLM, But Personal

Datagotchi's Data Insights feature transforms your gameplay and knowledge into a powerful personal AI assistant:

#### **Build Your Knowledge Base**

- 📤 **Upload Documents**: Add PDFs, notes, articles - anything you want to learn from
- 🎮 **Game-Generated Data**: Every game you play adds to your knowledge repository
- 🔗 **Web Scraping**: Save interesting articles and websites directly
- 📝 **Personal Notes**: Add your own thoughts and observations

#### **AI-Powered Intelligence**

- 💬 **Smart Chat**: Ask questions about your collected knowledge
- 🔍 **Semantic Search**: Find connections across all your data
- 📈 **Pattern Recognition**: Discover trends in your learning journey
- 🎯 **Personalized Insights**: Get recommendations based on your interests

#### **Self-Discovery Dashboard**

- 📊 **Learning Analytics**: Visualize your knowledge growth over time
- 🏆 **Skill Progress**: Track improvement across different domains
- 🧩 **Knowledge Map**: See how your interests connect and evolve
- 📅 **Activity Patterns**: Understand when and how you learn best

### 🔮 The Future of Personal AI

As you feed more data into your Datagotchi:

1. **Your AI becomes uniquely yours** - Understanding your perspective
2. **Insights get deeper** - Connecting dots you might miss
3. **Learning accelerates** - AI suggests optimal learning paths
4. **Value increases** - Your curated knowledge becomes a personal asset

## 🌍 World Integration

Datagotchi is built specifically for the World ecosystem:

### MiniKit SDK Features

- **World ID Authentication** - Secure, privacy-preserving login
- **Proof of Personhood** - Ensures one account per human
- **Mini App Standards** - Optimized for World App interface
- **Privacy First** - No personal data collection

### Benefits for World Users

- Earn while learning
- Contribute to ethical AI training
- Own and control your data
- Build reputation in the World ecosystem

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- Poetry (Python package manager)
- Supabase account
- World App for testing

### Frontend Setup

```bash
cd client
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
```

### Backend Setup

```bash
cd back
poetry install
cp .env.example .env
# Configure your environment variables
poetry run uvicorn src.main:app --reload
```

### Environment Variables

#### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_ID=your_world_app_id
```

#### Backend (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_key
NOTTE_API_KEY=your_notte_key
```

## 📦 Deployment

The project uses Google Cloud Build for CI/CD:

### Staging

```bash
# Triggers on push to staging branch
# Uses cloudbuild-staging.yaml
```

### Production

```bash
# Triggers on push to main branch
# Uses cloudbuild-production.yaml
```

See `CLOUD_BUILD_TRIGGER_SETUP.md` for detailed deployment instructions.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- World team for the MiniKit SDK and ecosystem
- Supabase for the backend infrastructure
- OpenAI for AI capabilities
- The capybara community for inspiration

## 📞 Contact

- **Website**: [datagotchi.ai](https://datagotchi.ai) (Coming Soon)
- **Email**: team@datagotchi.ai
- **Discord**: [Join our community](https://discord.gg/datagotchi)

---

<div align="center">
  <p>Built with ❤️ for the World ecosystem</p>
  <p>© 2024 Datagotchi Team. All rights reserved.</p>
</div>
