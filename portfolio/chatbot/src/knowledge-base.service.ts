import { Injectable, OnModuleInit } from '@nestjs/common';

interface KnowledgeChunk {
  text: string;
  source: string;
}

@Injectable()
export class KnowledgeBaseService implements OnModuleInit {
  private chunks: KnowledgeChunk[] = [];
  private readonly CHUNK_SIZE = 300;
  private readonly OVERLAP = 50;

  // Full CV and portfolio text as the knowledge base
  private readonly cvText = `
YOUSEF MALAK IBRAHIM ANDRAWS
AI Engineer and Machine Learning Developer
Located in Maadi, Cairo, Egypt
Phone: +20127541614
Email: yousefmalak55@gmail.com
LinkedIn and GitHub available

EDUCATION
Bachelor of Computer Science, Software Engineering, 2023-2027
Ain Shams University (ASU), GPA: 3.4 out of 4.0 (Very Good)

WORK EXPERIENCE
AI Engineer at Wider (Multinational Company), 2025 to Present
- Built and deployed backend AI agent infrastructure handling production authentication flows
- Implemented Knowledge Graph systems with semantic metadata enrichment using LLM extraction pipelines
- Integrated LangChain-based agents communicating with graph services via REST APIs (POST/GET)
- Collaborated with cross-functional teams on multi-agent system architecture and deployment

AI CERTIFICATIONS
AI Agent Developer Course at Orange Digital Center, February 2026
Grade: 99.3 percent, Duration: 30 Hours
Topics covered: AI Agents, LLMs, Prompt Engineering, LangChain Basics, Knowledge Integration (RAG, Vector Stores)
Multi-Agent Systems, Deployment and Optimization, agent coordination and inter-agent communication

PROJECTS
1. Sadeed - AI Claim Management System (GitHub Repository)
   Technologies: Django, LangGraph, pgvector, Celery, Redis, Docker
   - Built a multi-agent LangGraph pipeline (Extractor, Investigator, Resolver, Explainer) for automated claim triage and resolution
   - Implemented semantic deduplication using pgvector HNSW indices with multilingual embeddings (Arabic and English) via paraphrase-multilingual-mpnet
   - Designed smart LLM routing via OpenRouter, dynamically dispatching simple versus complex claims to cost-appropriate models
   - Built a fraud detection engine combining rule-based anomaly scoring with a Supabase fraud_patterns database for flagging bad actors
   - Implemented an auto-retraining pipeline using Celery workers that feeds rejected decisions to a reflection model for dynamic prompt optimization
   - Deployed multi-service architecture via Docker Compose with async task queues and K-Means clustering analytics endpoints

2. AI Travel Reservation Chatbot
   Technologies: n8n, API Integration
   - Developed an automated chatbot integrating multiple flight and hotel reservation APIs for real-time booking
   - Built workflow automation pipelines using n8n for API orchestration and conversational interactions

3. Online Exam Management System
   Technologies: Java, JavaFX, Maven
   - Built a desktop application enabling admins to create and manage exams with automated grading
   - Implemented user authentication, performance tracking, and file-based data persistence using OOP

4. Land Type Classification - Satellite Imagery
   Technologies: Python, TensorFlow, Sentinel-2
   - Compared ResNet50 (81.9% accuracy) and EfficientNetB0 (96.3% accuracy) on NWPU-RESISC45 dataset
   - Achieved 96.3 percent accuracy with EfficientNetB0 for multi-class land cover detection

5. Forest Cover Type Prediction
   Technology: XGBoost Classifier
   - Multi-class classification achieving 86.6 percent accuracy
   - Engineered interaction features for improved results

6. Walmart Sales Forecasting
   Technologies: LightGBM, Time Series
   - Predicted weekly sales with MAE approximately 7277 dollars
   - Applied rolling averages and TimeSeriesSplit cross-validation

7. Diabetes Prediction Model
   Technologies: Scikit-learn, SMOTE
   - Applied SMOTE balancing
   - Trained Logistic Regression, SVM, Random Forest achieving 76 percent accuracy

8. Image Segmentation App
   Technologies: C#, Windows Forms, DSU
   - Graph-based segmentation with Gaussian smoothing, parallel RGB processing, and multi-format export

9. Mall Customer Segmentation
   Technology: K-Means Clustering
   - Segmented customers into 5 clusters via Elbow method
   - Visualized spending versus income patterns

SKILLS
AI and Agents: LangChain, LangGraph, Multi-Agent Systems, RAG, Prompt Engineering, Knowledge Graphs
Machine Learning: Scikit-learn, TensorFlow, PyTorch, XGBoost, LightGBM, SMOTE
Backend: Django, FastAPI, Scalable APIs, REST design, authentication flows, modular architecture
Data and Vector Databases: pgvector, Qdrant, Supabase, PostgreSQL, Redis, Celery, Docker
Automation: n8n, API orchestration, chatbot pipelines, low-code workflows
Languages: Python, Java, C#, C++, JavaScript, SQL
Tools: Pandas, Jupyter, Streamlit, Seaborn, JavaFX, Pillow, Torchvision

LANGUAGES
Arabic (Native), English (Fluent written and spoken), German (Good written)

EXTRACURRICULAR ACTIVITIES
Head of AI at iCLUB (Student Club), 2024 to Present
- Led strategic AI initiatives and organized workshops on generative AI, model deployment, and ethics
- Mentored members in Python, TensorFlow, and cloud-based ML pipeline development
- Integrated AI solutions into club-led tech products and demos
`;

  async onModuleInit() {
    this.chunks = this.createChunks(this.cvText, 'CV');
    console.log(`Knowledge base initialized with ${this.chunks.length} chunks`);
  }

  private createChunks(text: string, source: string): KnowledgeChunk[] {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
    const chunks: KnowledgeChunk[] = [];

    for (let i = 0; i < sentences.length; i += this.CHUNK_SIZE) {
      const chunk = sentences.slice(i, i + this.CHUNK_SIZE).join(' ');
      if (chunk.trim().length > 30) {
        chunks.push({ text: chunk.trim(), source });
      }
    }

    // Also create paragraph-based chunks
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 30);
    paragraphs.forEach((para, idx) => {
      if (para.trim().length > 30) {
        chunks.push({ text: para.trim(), source: `${source}-para-${idx}` });
      }
    });

    return chunks;
  }

  async search(query: string, topK: number = 5): Promise<KnowledgeChunk[]> {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Semantic keyword matching with scoring
    const scoredChunks = this.chunks.map(chunk => {
      let score = 0;
      const chunkLower = chunk.text.toLowerCase();

      // Exact word matches
      queryWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = chunkLower.match(regex);
        if (matches) score += matches.length * 2;

        // Partial matches
        if (chunkLower.includes(word)) score += 1;
      });

      // Boost for technical terms
      const techTerms = ['langchain', 'langgraph', 'tensorflow', 'python', 'django',
        'fastapi', 'pgvector', 'redis', 'docker', 'xgboost', 'scikit', 'pytorch',
        'lightgbm', 'n8n', 'openrouter', 'rag', 'embedding', 'vector', 'agent',
        'llm', 'gpt', 'claude', 'embedding', 'classification', 'regression',
        'neural', 'deep learning', 'machine learning', 'ai', 'ml'];
      techTerms.forEach(term => {
        if (chunkLower.includes(term) && queryLower.includes(term)) score += 3;
      });

      // Length penalty (prefer medium chunks)
      if (chunk.text.length > 500) score -= 2;
      if (chunk.text.length < 50) score -= 1;

      return { ...chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK).filter(c => c.score > 0);
  }

  getAllKnowledge(): string {
    return this.cvText;
  }
}