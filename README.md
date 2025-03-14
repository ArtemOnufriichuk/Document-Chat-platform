# Document Chat with PDF Support

This application enables users to chat with PDF documents from various sources. It analyzes document content using Anthropic's Claude AI model to answer questions about the documents.

## Features

- **Universal PDF Support**: Works with PDFs from any publicly accessible URL
- **Chat Interface**: Interactive chat interface to ask questions about your documents
- **Document Management**: Add, view, and manage your documents 
- **Authentication**: Simple user authentication system with admin privileges
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- NPM or Yarn
- Claude API key from Anthropic

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Claude API key:
   ```
   CLAUDE_API_KEY=your_api_key_here
   CLAUDE_MODEL=claude-3-haiku-20240307
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Login**: Use the default credentials (admin/admin123) to log in
2. **Add Documents**: Navigate to the Documents tab and add PDF documents by URL
   - Ensure the documents are publicly accessible
3. **Chat with Documents**: Go to the Chat tab, select documents, and ask questions

## Adding Documents

1. Find a PDF document with a public URL
2. Copy the URL
3. Paste the URL in the "Add Document" form with a descriptive title

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **PDF Processing**: PDF.js
- **AI**: Anthropic Claude API
- **State Management**: Zustand

## License

This project is licensed under the MIT License
