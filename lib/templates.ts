// LLMS.txt templates for different business types
// These templates follow best practices from industry leaders

// Base template structure that all LLMS.txt files should follow
const baseStructure = `# {companyName}

## About
{description}

## Services
{services}

## Contact
{contactInfo}

## API Documentation
{apiDocs}

## Team
{teamInfo}

## Additional Information
{additionalInfo}
`;

// Template for catalog/marketplace businesses (like Airbnb, Amazon)
export const catalogTemplate = `# {companyName}

## About
{companyName} is a comprehensive platform that connects {primaryAudience} with {primaryOffering}. {description}

## Core Services
Our platform provides:
{services}

## How It Works
1. Browse our extensive catalog of {primaryOffering}
2. Compare options based on your specific needs
3. Connect directly with providers
4. Complete transactions securely through our platform

## For Partners
We welcome {partnerType} to join our platform. Benefits include:
- Access to our large user base
- Integrated payment processing
- Analytics and insights dashboard
- Marketing support and visibility

## API Access
{apiDocs}
Developers can integrate with our platform to:
- Access catalog data
- Submit new listings
- Process transactions
- Retrieve analytics

## Contact Information
{contactInfo}
For partnership inquiries: partners@{domain}
For technical support: support@{domain}

## Our Mission
{mission}

## Platform Statistics
- Active users: {userCount}
- Listed items: {itemCount}
- Countries served: {countryCount}
`;

// Template for specialist/agency businesses (like consultancies, agencies)
export const specialistTemplate = `# {companyName}

## About
{companyName} is a specialized {industryType} firm focused on {primaryService}. {description}

## Our Expertise
{services}

We bring {yearsExperience} years of experience in:
{expertiseAreas}

## Our Approach
{approach}

Every client engagement follows our proven methodology:
1. Discovery and assessment
2. Strategy development
3. Implementation
4. Optimization and support

## Case Studies
{caseStudies}

## Why Choose {companyName}
- {differentiator1}
- {differentiator2}
- {differentiator3}

## Team
{teamInfo}

Our team includes experts in:
{teamExpertise}

## Contact
{contactInfo}
Schedule a consultation: {consultationLink}

## Client Testimonials
{testimonials}
`;

// Template for ecosystem/suite businesses (like Microsoft, Adobe)
export const ecosystemTemplate = `# {companyName}

## About
{companyName} provides an integrated ecosystem of {productCategory} solutions. {description}

## Product Suite
{services}

All products are designed to work seamlessly together, providing:
- Unified data management
- Cross-product workflows
- Centralized administration
- Consistent user experience

## Integration Capabilities
Our ecosystem integrates with:
{integrations}

## For Developers
{apiDocs}

Build on our platform:
- RESTful APIs for all products
- SDKs in multiple languages
- Webhook support
- Comprehensive documentation

## For Enterprises
Enterprise benefits include:
- Volume licensing
- Dedicated support
- Custom integrations
- Training programs

## Security and Compliance
{securityInfo}

## Contact
{contactInfo}
Sales: sales@{domain}
Support: support@{domain}
Partners: partners@{domain}

## Resources
- Documentation: docs.{domain}
- Community: community.{domain}
- Training: learn.{domain}
`;

// Helper function to select the appropriate template
export function getTemplateForBusinessType(businessType: 'catalog' | 'specialist' | 'ecosystem'): string {
  const templates = {
    catalog: catalogTemplate,
    specialist: specialistTemplate,
    ecosystem: ecosystemTemplate,
  };
  
  return templates[businessType] || baseStructure;
}

// Function to clean up the final output
export function cleanTemplate(content: string): string {
  // Remove any sections that have placeholders (like {variable})
  const lines = content.split('\n');
  const cleanedLines = lines.filter(line => !line.includes('{') && !line.includes('}'));
  
  // Remove empty sections
  let result = cleanedLines.join('\n');
  
  // Clean up multiple empty lines
  result = result.replace(/\n\n\n+/g, '\n\n');
  
  // Remove sections with no content
  result = result.replace(/## \w+\n\n## /g, '## ');
  
  return result.trim();
}