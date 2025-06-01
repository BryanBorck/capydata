# CapyData - Learn, Earn & Train AI

<div align="center">
  <img src="client/public/capybara/variants/default-capybara.png" alt="CapyData Capybara" width="200"/>

    [![World Mini App](https://img.shields.io/badge/World-Mini%20App-8B5CF6)](https://worldcoin.org/)

[![Next.js](https://img.shields.io/badge/Next.js-15-000000)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

</div>

## Overview

CapyData is a gamified learn-to-earn platform built as a World Mini App. Users create virtual capybara pets while contributing to AI training through educational mini-games and personal knowledge base building.

### Core Features

- Virtual pet system with customizable capybara companions
- Four educational mini-games that generate AI training data
- Personal knowledge base with AI-powered insights
- AI assistant trained on user's data
- Data visualization and learning analytics
- Achievement system with XP and skill tracking
- World ID authentication for verified humans

## Value Proposition

### For Users

- Earn rewards while playing educational games
- Build and train a personal AI assistant
- Own and control your data
- Track learning progress and patterns
- Customize virtual pets based on achievements

### For AI Development

- Verified human-generated training data
- Quality control through gamification
- Decentralized data collection
- Ethical AI training with user consent
- Direct compensation for contributions

## Technical Architecture

### Frontend

- **Framework**: Next.js 15.3.3 with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Authentication**: World ID via MiniKit SDK
- **Database**: Supabase client SDK

### Backend

- **Framework**: FastAPI 0.111.0
- **Language**: Python 3.11+
- **AI/ML**: OpenAI API, Notte SDK 1.4.4
- **Database**: Supabase (PostgreSQL)
- **Data Processing**: Pandas, NumPy, PyArrow

### API Structure

- `/api/v1/auth/*` - World ID authentication
- `/api/v1/storage/*` - Pet and knowledge management
- `/api/v1/ai/*` - AI inference and generation
- `/api/v1/games/*` - Game mechanics and scoring

## Mini-Games

### Image Quality Judge

Select the highest quality image from 4 options. Trains computer vision models on human quality preferences. Awards 5 points per round.

### Language Flashcards

Learn vocabulary in multiple languages. Validates and improves translation accuracy. Awards 8 points per session.

### Mood Detective

Identify emotional tone in text messages. Enhances sentiment analysis capabilities. Awards 6 points per classification.

### Knowledge Trivia

Answer questions across various topics. Validates factual accuracy and builds knowledge graphs. Awards 15 points per session.

## Pet System

### Rarities

- Common (Gray) - Basic capybaras
- Rare (Blue) - Special color variants
- Epic (Purple) - Unique traits
- Legendary (Orange) - Extremely rare

### Variants

- Default Brown
- Pink
- Blue
- Ice
- Black

### Skills

- Science - From image and data tasks
- Code - From technical challenges
- Social - From language learning
- Trivia - From knowledge questions
- Trenches - From difficult tasks
- Streak - From daily consistency

## Data Insights

### Knowledge Base Building

- Upload documents (PDFs, notes, articles)
- Automatic data collection from gameplay
- Web scraping capabilities
- Personal note management

### AI Features

- Conversational interface for knowledge queries
- Semantic search across all data
- Pattern recognition and trend analysis
- Personalized recommendations

### Analytics

- Learning progress visualization
- Skill development tracking
- Knowledge mapping
- Activity pattern analysis

## Development Setup

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
# Configure environment variables
npm run dev
```

### Backend Setup

```bash
cd back
poetry install
cp .env.example .env
# Configure environment variables
poetry run uvicorn src.main:app --reload
```

### Environment Variables

Frontend (.env.local):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_ID=your_world_app_id
```

Backend (.env):

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_key
NOTTE_API_KEY=your_notte_key
```

## Deployment

The project uses Google Cloud Build for CI/CD:

- **Staging**: Push to staging branch (cloudbuild-staging.yaml)
- **Production**: Push to main branch (cloudbuild-production.yaml)

See CLOUD_BUILD_TRIGGER_SETUP.md for detailed instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Contact

- Website: capydata.ai (Coming Soon)
- Email: team@capydata.ai

---

<div align="center">
  <p>Built for the World ecosystem</p>
  <p>© 2024 CapyData Team. All rights reserved.</p>
</div>
