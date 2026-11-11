#!/bin/bash
set -e
# An adopted Angular project whose last commit changes what users see.
mkdir -p .engineering src/app/hero
printf 'harness: "0.3"\nprofiles: [angular]\nadr_dir: docs/adr\n' > .engineering/harness.yaml
printf '{ "name": "site", "private": true, "scripts": { "start": "ng serve", "test": "ng test" } }\n' > package.json
git init -q
git config user.email eval@example.com
git config user.name eval
git config commit.gpgsign false
cat > src/app/hero/hero.html <<'HTML'
<h1 class="hero-title">We build software.</h1>
<a class="button" href="#contact">Contact us</a>
HTML
cat > src/app/hero/hero.css <<'CSS'
.button { background: #4f46e5; color: #fff; padding: 12px 20px; }
CSS
git add -A && git commit -qm 'feat: hero section'
cat > src/app/hero/hero.html <<'HTML'
<h1 class="hero-title">We design and build software products, end to end.</h1>
<a class="button" href="#contact">Talk to us</a>
<a class="button button-secondary" href="#products">See our products</a>
HTML
cat >> src/app/hero/hero.css <<'CSS'
.button-secondary { background: transparent; color: #4f46e5; border: 1px solid #4f46e5; }
CSS
git add -A && git commit -qm 'feat(hero): name what we do and link the products'
