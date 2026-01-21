import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Tag, ChevronLeft, ChevronRight, BookOpen, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SEO } from '@/components/SEO';
import { useTheme } from '@/hooks/useTheme';
import { getBlogPost, blogPosts } from '@/lib/blogData';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const post = slug ? getBlogPost(slug) : undefined;

  // Find previous and next posts
  const currentIndex = blogPosts.findIndex(p => p.slug === slug);
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Convert markdown-style content to HTML-like rendering
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside text-muted-foreground space-y-2 ml-4 my-4">
            {currentList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      // Code block handling
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeContent = '';
        } else {
          elements.push(
            <pre key={`code-${index}`} className="my-4 p-4 rounded-lg bg-muted/50 border border-border overflow-x-auto">
              <code className="text-sm font-mono text-foreground">{codeContent.trim()}</code>
            </pre>
          );
          inCodeBlock = false;
          codeContent = '';
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        return;
      }

      // Headers
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="font-heading text-2xl font-semibold mt-10 mb-4 text-foreground">
            {line.slice(3)}
          </h2>
        );
        return;
      }

      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="font-heading text-xl font-semibold mt-8 mb-3 text-foreground">
            {line.slice(4)}
          </h3>
        );
        return;
      }

      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        currentList.push(line.trim().slice(2));
        return;
      }

      // Numbered list
      if (/^\d+\.\s/.test(line.trim())) {
        flushList();
        elements.push(
          <p key={`num-${index}`} className="text-muted-foreground leading-relaxed my-2 ml-4">
            {line.trim()}
          </p>
        );
        return;
      }

      // Bold text handling and inline code
      flushList();
      const processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-foreground text-sm font-mono">$1</code>');

      elements.push(
        <p 
          key={`p-${index}`} 
          className="text-muted-foreground leading-relaxed my-4"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });

    flushList();
    return elements;
  };

  return (
    <>
      <SEO 
        title={`${post.title} - TradeMoq Blog`}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        canonical={`https://trademoq.com/blog/${post.slug}`}
        ogType="article"
      />
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl overflow-hidden" style={{ height: '64px' }}>
          <div className="container mx-auto px-6 h-full flex items-center justify-between">
            <Link to="/" className="flex items-center group h-full">
              <img
                src={isDarkMode ? '/tm_logo.svg' : '/tm_logo_black.svg'}
                alt="TradeMoq Logo"
                className="h-48 w-auto transition-all duration-300 group-hover:scale-105"
                key={theme}
              />
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link to="/#features" className="nav-link">Features</Link>
              <Link to="/#how-it-works" className="nav-link">How It Works</Link>
              <Link to="/#pricing" className="nav-link">Pricing</Link>
              <Link to="/blog" className="nav-link text-primary">Blog</Link>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/blog">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  All Articles
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Article Content */}
        <main className="pt-32 pb-20 px-6">
          <article className="container mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{post.category}</span>
            </div>

            {/* Header */}
            <header className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {post.category}
                </span>
              </div>
              
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
                {post.title}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-6">
                {post.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime}</span>
                </div>
                
                {/* Share button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 ml-auto"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share
                    </>
                  )}
                </Button>
              </div>
            </header>

            {/* Article Body */}
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {renderContent(post.content)}
            </div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${tag}`}
                    className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation between posts */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="grid md:grid-cols-2 gap-4">
                {prevPost ? (
                  <Link
                    to={`/blog/${prevPost.slug}`}
                    className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous Article</span>
                    </div>
                    <h3 className="font-heading font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {prevPost.title}
                    </h3>
                  </Link>
                ) : (
                  <div />
                )}
                
                {nextPost && (
                  <Link
                    to={`/blog/${nextPost.slug}`}
                    className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-2">
                      <span>Next Article</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <h3 className="font-heading font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {nextPost.title}
                    </h3>
                  </Link>
                )}
              </div>
            </div>
          </article>
        </main>

        {/* CTA Section */}
        <section className="py-16 px-6 border-t border-border bg-muted/20">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Ready to Put This Into Practice?
            </h2>
            <p className="text-muted-foreground mb-6">
              Start tracking your trading signals with TradeMoq today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                  Get Started Free
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="outline" size="lg" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  More Articles
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-6 bg-muted/10">
          <div className="container mx-auto max-w-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 TradeMoq. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/blog" className="text-foreground font-medium">Blog</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BlogPost;
