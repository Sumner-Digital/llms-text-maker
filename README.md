# LLMS Text Maker

A Next.js application that automatically generates optimized LLMS.txt files for websites. This tool scrapes homepage content and creates AI-readable files following current best practices.

## 🚀 Features

- **Automatic Web Scraping**: Extracts content from any website using Cheerio and Playwright
- **Intelligent Data Extraction**: Finds company information, services, contact details, and more
- **Template-Based Generation**: Uses AI to fill professional templates for different business types
- **Cost-Optimized**: Minimal AI token usage (~$0.01-0.02 per generation)
- **Iframe-Friendly**: All styles are external for seamless embedding
- **Real-Time Progress**: Visual feedback during the generation process

## 📋 Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager
- Anthropic API key

## 🔧 Installation

1. Clone or download this repository to your local machine

2. Navigate to the project directory:
   ```bash
   cd "llms write"
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

4. Create a `.env.local` file in the root directory and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your-api-key-here
   ```
   
   Get your API key from: https://console.anthropic.com/

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## 📁 Project Structure

```
llms write/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── validate/      # URL validation
│   │   ├── scrape/        # Web scraping
│   │   ├── extract/       # Data extraction
│   │   └── generate/      # LLMS.txt generation
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── URLInput.tsx       # URL input field
│   ├── ProgressIndicator.tsx # Progress feedback
│   └── ResultDisplay.tsx  # Generated content display
├── lib/                   # Core business logic
│   ├── scraper.ts         # Web scraping logic
│   ├── extractor.ts       # Data extraction logic
│   ├── generator.ts       # AI generation logic
│   └── templates.ts       # LLMS.txt templates
├── styles/                # CSS files
│   └── main.css           # All application styles
├── types/                 # TypeScript type definitions
│   └── index.ts           # Shared types
└── utils/                 # Utility functions
    └── constants.ts       # Application constants
```

## 💡 How It Works

1. **URL Validation**: Checks if the provided URL is valid and accessible
2. **Web Scraping**: Downloads the website content using Cheerio (fast) or Playwright (for JS-heavy sites)
3. **Data Extraction**: Analyzes HTML, meta tags, and structured data to extract business information
4. **AI Generation**: Uses Claude to fill professional templates with the extracted data
5. **Output**: Provides a downloadable LLMS.txt file optimized for AI consumption

## 🔍 API Endpoints

- `POST /api/validate` - Validates URLs
- `POST /api/scrape` - Scrapes website content
- `POST /api/extract` - Extracts structured data
- `POST /api/generate` - Generates LLMS.txt content

## 🛠️ Configuration

### Environment Variables
- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)

### Constants (in `utils/constants.ts`)
- `TIMEOUTS` - Timeout values for scraping and API calls
- `MAX_FILE_SIZE` - Maximum size for generated files (2MB)
- `API_CONFIG` - Claude API configuration

## 🎨 Customization

### Templates
Edit `lib/templates.ts` to modify the LLMS.txt templates for different business types:
- Catalog businesses (marketplaces, directories)
- Specialist businesses (agencies, consultants)
- Ecosystem businesses (software suites, platforms)

### Styling
All styles are in `styles/main.css`. The app uses CSS variables for easy theming.

## 🐛 Troubleshooting

### "Website is blocking our access"
Some websites block automated scraping. Try:
- Using a different URL (e.g., about page)
- Adding schema.org markup to your website
- Contacting the website owner

### "No structured data found"
The website lacks schema.org markup. This may result in lower quality extraction.

### "Generation failed"
Check that your Anthropic API key is valid and has sufficient credits.

## 📊 Cost Estimation

Each generation costs approximately $0.01-0.02 in API fees:
- ~500 input tokens for the prompt
- ~300 output tokens for the response
- Using Claude 3 Sonnet for cost efficiency

## 🔒 Security

- API keys are stored in environment variables
- No user data is stored or logged
- All external requests use HTTPS
- Input validation on all endpoints

## 📝 License

This project is built for internal use. Please respect website terms of service when scraping.

## 🤝 Contributing

To contribute:
1. Test your changes thoroughly
2. Follow the existing code style
3. Update documentation as needed
4. Ensure all TypeScript types are correct

## 📞 Support

For issues or questions:
- Check the console for detailed error messages
- Verify your API key is correct
- Ensure the target website is accessible
- Review the scraping warnings in the browser console

## 🚦 Development Tips

1. **Use the Network tab** in browser DevTools to monitor API calls
2. **Check console logs** for detailed debugging information
3. **Test with various websites** to ensure robustness
4. **Monitor API usage** in the Anthropic console

---

Built with Next.js, TypeScript, and Claude AI