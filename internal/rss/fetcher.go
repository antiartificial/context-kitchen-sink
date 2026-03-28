// Package rss fetches headlines from RSS feeds for the newsroom live data feature.
package rss

import (
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Item represents an RSS feed item.
type Item struct {
	Title   string `xml:"title"`
	Link    string `xml:"link"`
	PubDate string `xml:"pubDate"`
}

type rssChannel struct {
	Items []Item `xml:"channel>item"`
}

// FetchHeadlines fetches up to maxItems headlines from the given RSS feed URL.
func FetchHeadlines(ctx context.Context, feedURL string, maxItems int) ([]Item, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, feedURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", "contextdb-playground/1.0")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch feed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("feed returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20)) // 1MB limit
	if err != nil {
		return nil, fmt.Errorf("read feed: %w", err)
	}

	var feed rssChannel
	if err := xml.Unmarshal(body, &feed); err != nil {
		return nil, fmt.Errorf("parse feed: %w", err)
	}

	if maxItems > 0 && len(feed.Items) > maxItems {
		feed.Items = feed.Items[:maxItems]
	}
	return feed.Items, nil
}

// DefaultFeeds returns a list of reliable public RSS feed URLs.
var DefaultFeeds = []string{
	"https://feeds.bbci.co.uk/news/rss.xml",
	"https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
	"https://feeds.reuters.com/reuters/topNews",
}
