import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import 'focus-visible'
import { SkipNavContent } from '@reach/skip-nav'
import { ThemeProvider } from 'next-themes'
import cn from 'classnames'
import Head from './head'
import Navbar from './navbar'
import Footer, { NavLinks } from './footer'
import Theme from './misc/theme'
import Sidebar from './sidebar'
import ToC from './toc'
import { ThemeConfigContext, useConfig } from './config'
import { ActiveAnchor } from './misc/active-anchor'
import defaultConfig from './misc/default.config'
import { getFSRoute } from './utils/get-fs-route'
import { MenuContext } from './utils/menu-context'
import normalizePages from './utils/normalize-pages'
import { Heading, PageMapItem, PageOpt } from 'nextra'
import { DocsThemeConfig } from './types'

function useDirectoryInfo(pageMap: PageMapItem[]) {
  const { locale, defaultLocale, asPath } = useParams()

  return useMemo(() => {
    const fsPath = getFSRoute(asPath, locale).split('#')[0]
    return normalizePages({
      list: pageMap,
      locale,
      defaultLocale,
      route: fsPath
    })
  }, [pageMap, locale, defaultLocale, asPath])
}

interface BodyProps {
  meta: Record<string, any>
  toc?: React.ReactNode
  filepathWithName: string
  navLinks: React.ReactNode
  children: React.ReactNode
}

function Body({ meta, toc, filepathWithName, navLinks, children }: BodyProps) {
  return (
    <React.Fragment>
      <SkipNavContent />
      {meta.full ? (
        <article className="relative pt-16 w-full overflow-x-hidden">
          {children}
        </article>
      ) : (
        <article className="docs-container relative pt-16 pb-16 px-6 md:px-8 w-full max-w-full flex min-w-0">
          <main className="max-w-screen-md mx-auto pt-4 z-10 min-w-0 w-full">
            <Theme>{children}</Theme>
            <Footer filepathWithName={filepathWithName}>{navLinks}</Footer>
          </main>
          {toc}
        </article>
      )}
    </React.Fragment>
  )
}

interface LayoutProps {
  filename: string
  pageMap: PageMapItem[]
  meta: Record<string, any>
  children: React.ReactNode
  titleText: string
  headings: Heading[]
}

const Layout = ({
  filename,
  pageMap,
  meta,
  children,
  titleText,
  headings
}: LayoutProps) => {
  const { route, locale } = useParams()
  const config = useConfig()

  const {
    activeType,
    activeIndex,
    // pageDirectories,
    flatPageDirectories,
    docsDirectories,
    flatDirectories,
    flatDocsDirectories,
    directories
  } = useDirectoryInfo(pageMap)

  const filepath = route.slice(0, route.lastIndexOf('/') + 1)
  const filepathWithName = filepath + filename
  const title = meta.title || titleText || 'Untitled'
  const isRTL = useMemo(() => {
    if (!config.i18n) return config.direction === 'rtl' || null
    const localeConfig = config.i18n.find(l => l.locale === locale)
    return localeConfig && localeConfig.direction === 'rtl'
  }, [config.i18n, locale])

  const [menu, setMenu] = useState(false)

  if (activeType === 'nav') {
    return (
      <React.Fragment>
        <Head title={title} locale={locale} meta={meta} />
        <MenuContext.Provider
          value={{
            menu,
            setMenu,
            defaultMenuCollapsed: !!config.defaultMenuCollapsed
          }}
        >
          <div
            className={cn('nextra-container main-container flex flex-col', {
              rtl: isRTL,
              page: true
            })}
          >
            <Navbar
              isRTL={isRTL}
              flatDirectories={flatDirectories}
              flatPageDirectories={flatPageDirectories}
            />
            <ActiveAnchor>
              <div className="flex flex-1 h-full">
                <Sidebar
                  directories={flatPageDirectories}
                  flatDirectories={flatDirectories}
                  fullDirectories={directories}
                  mdShow={false}
                  headings={headings}
                />
                <Body
                  meta={meta}
                  filepathWithName={filepathWithName}
                  navLinks={null}
                >
                  {children}
                </Body>
              </div>
            </ActiveAnchor>
          </div>
        </MenuContext.Provider>
      </React.Fragment>
    )
  }

  // Docs layout
  return (
    <React.Fragment>
      <Head title={title} locale={locale} meta={meta} />
      <MenuContext.Provider
        value={{
          menu,
          setMenu,
          defaultMenuCollapsed: !!config.defaultMenuCollapsed
        }}
      >
        <div
          className={cn('nextra-container main-container flex flex-col', {
            rtl: isRTL
          })}
        >
          <Navbar
            isRTL={isRTL}
            flatDirectories={flatDirectories}
            flatPageDirectories={flatPageDirectories}
          />
          <ActiveAnchor>
            <div className="flex flex-1 h-full">
              <Sidebar
                directories={docsDirectories}
                flatDirectories={flatDirectories}
                fullDirectories={directories}
                headings={headings}
              />
              <Body
                meta={meta}
                filepathWithName={filepathWithName}
                toc={<ToC headings={config.floatTOC ? headings : null} />}
                navLinks={
                  <NavLinks
                    flatDirectories={flatDocsDirectories}
                    currentIndex={activeIndex}
                    isRTL={isRTL}
                  />
                }
              >
                {children}
              </Body>
            </div>
          </ActiveAnchor>
        </div>
      </MenuContext.Provider>
    </React.Fragment>
  )
}

export default (opts: PageOpt, config: DocsThemeConfig) => {
  const extendedConfig = Object.assign({}, defaultConfig, config)
  return (props: any) => {
    return (
      <ThemeConfigContext.Provider value={extendedConfig}>
        <ThemeProvider attribute="class">
          <Layout {...opts} {...props} />
        </ThemeProvider>
      </ThemeConfigContext.Provider>
    )
  }
}