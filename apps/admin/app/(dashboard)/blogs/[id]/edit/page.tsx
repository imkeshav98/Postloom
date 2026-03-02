"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const PALETTES = [
  { value: "default", label: "Indigo", primary: "#4f46e5", accent: "#7c3aed" },
  { value: "coral", label: "Coral", primary: "#ea580c", accent: "#dc2626" },
  { value: "emerald", label: "Emerald", primary: "#059669", accent: "#0284c7" },
  { value: "teal", label: "Teal", primary: "#0f766e", accent: "#b45309" },
] as const;

interface BlogData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  niche: string;
  description: string | null;
  logoUrl: string | null;
  adsenseId: string | null;
  defaultAuthor: string;
  language: string;
  siteConfig: {
    palette: string;
    googleAnalyticsId: string | null;
    googleSearchConsoleKey: string | null;
    twitterHandle: string | null;
    facebookUrl: string | null;
    postsPerPage: number;
    enableComments: boolean;
    faviconUrl: string | null;
    ogImageUrl: string | null;
    heroImageUrl: string | null;
  } | null;
}

export default function BlogEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Blog fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [niche, setNiche] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [language, setLanguage] = useState("en");
  const [defaultAuthor, setDefaultAuthor] = useState("Admin");
  const [logoUrl, setLogoUrl] = useState("");
  const [adsenseId, setAdsenseId] = useState("");

  // SiteConfig fields
  const [palette, setPalette] = useState("default");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [googleSearchConsoleKey, setGoogleSearchConsoleKey] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [enableComments, setEnableComments] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");

  useEffect(() => {
    fetch(`/api/blogs/${id}`)
      .then((res) => res.json())
      .then((blog: BlogData) => {
        setName(blog.name);
        setSlug(blog.slug);
        setNiche(blog.niche);
        setDescription(blog.description ?? "");
        setDomain(blog.domain ?? "");
        setLanguage(blog.language);
        setDefaultAuthor(blog.defaultAuthor);
        setLogoUrl(blog.logoUrl ?? "");
        setAdsenseId(blog.adsenseId ?? "");

        if (blog.siteConfig) {
          setPalette(blog.siteConfig.palette);
          setGoogleAnalyticsId(blog.siteConfig.googleAnalyticsId ?? "");
          setGoogleSearchConsoleKey(blog.siteConfig.googleSearchConsoleKey ?? "");
          setTwitterHandle(blog.siteConfig.twitterHandle ?? "");
          setFacebookUrl(blog.siteConfig.facebookUrl ?? "");
          setPostsPerPage(blog.siteConfig.postsPerPage);
          setEnableComments(blog.siteConfig.enableComments);
          setFaviconUrl(blog.siteConfig.faviconUrl ?? "");
          setOgImageUrl(blog.siteConfig.ogImageUrl ?? "");
          setHeroImageUrl(blog.siteConfig.heroImageUrl ?? "");
        }
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          niche,
          description: description || null,
          domain: domain || null,
          language,
          defaultAuthor,
          logoUrl: logoUrl || null,
          adsenseId: adsenseId || null,
          siteConfig: {
            palette,
            googleAnalyticsId: googleAnalyticsId || null,
            googleSearchConsoleKey: googleSearchConsoleKey || null,
            twitterHandle: twitterHandle || null,
            facebookUrl: facebookUrl || null,
            postsPerPage,
            enableComments,
            faviconUrl: faviconUrl || null,
            ogImageUrl: ogImageUrl || null,
            heroImageUrl: heroImageUrl || null,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
        return;
      }

      toast.success("Blog updated");
      router.push(`/blogs/${id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Link
        href={`/blogs/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-content">Edit {name}</h2>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="basic">
        <TabsList variant="pill">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="seo">SEO & Social</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Blog Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="niche">Niche</Label>
                  <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="myblog.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultAuthor">Default Author</Label>
                  <Input id="defaultAuthor" value={defaultAuthor} onChange={(e) => setDefaultAuthor(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO & Social</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                  <Input id="googleAnalyticsId" value={googleAnalyticsId} onChange={(e) => setGoogleAnalyticsId(e.target.value)} placeholder="G-XXXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleSearchConsoleKey">Search Console Key</Label>
                  <Input id="googleSearchConsoleKey" value={googleSearchConsoleKey} onChange={(e) => setGoogleSearchConsoleKey(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitterHandle">Twitter Handle</Label>
                  <Input id="twitterHandle" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} placeholder="@handle" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook URL</Label>
                  <Input id="facebookUrl" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageField label="Logo URL" value={logoUrl} onChange={setLogoUrl} />
              <ImageField label="Favicon URL" value={faviconUrl} onChange={setFaviconUrl} />
              <ImageField label="OG Image URL" value={ogImageUrl} onChange={setOgImageUrl} />
              <ImageField label="Hero Image URL" value={heroImageUrl} onChange={setHeroImageUrl} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color Palette</Label>
                <div className="grid grid-cols-4 gap-3">
                  {PALETTES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPalette(p.value)}
                      className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                        palette === p.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-edge hover:border-muted-foreground/40"
                      }`}
                    >
                      {palette === p.value && (
                        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: p.primary }} />
                        <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: p.accent }} />
                      </div>
                      <span className="text-xs font-medium text-content">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postsPerPage">Posts Per Page</Label>
                  <Input id="postsPerPage" type="number" min={1} max={100} value={postsPerPage} onChange={(e) => setPostsPerPage(parseInt(e.target.value) || 10)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adsenseId">AdSense ID</Label>
                <Input id="adsenseId" value={adsenseId} onChange={(e) => setAdsenseId(e.target.value)} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="enableComments" checked={enableComments} onCheckedChange={setEnableComments} />
                <Label htmlFor="enableComments">Enable Comments</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
      {value && (
        <div className="mt-2 overflow-hidden rounded-lg border border-edge/60 dark:border-white/[0.06]">
          <div className="relative h-24 bg-surface-alt">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
