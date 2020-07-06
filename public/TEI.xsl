<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:html="http://www.w3.org/1999/xhtml"
	xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns="http://www.tei-c.org/ns/1.0" exclude-result-prefixes="tei html">

	<xsl:param name="title">No title</xsl:param>
	<xsl:param name="author">Aldo Moro</xsl:param>
	<xsl:param name="publication">No publication details</xsl:param>
	<xsl:param name="source">No source details</xsl:param>

	<xsl:output encoding="UTF-8" indent="yes" method="xml" />
	<xsl:key name="persons" match="html:span[contains(@class, 'person')]/@about" use="." />
	<xsl:key name="organizations" match="html:span[contains(@class, 'organization')]/@about" use="." />
	<xsl:key name="places" match="html:span[contains(@class, 'place')]/@about" use="." />
	<xsl:key name="bibref" match="html:span[contains(@class, 'bib')]/@about" use="." />
	<xsl:key name="quotes" match="html:span[contains(@class, 'quote')]/@about" use="." />
	<xsl:key name="innerStrings" match="html:span[contains(@class, 'mention')]/text()" use="." />

	<xsl:template match="/">
		<tei:TEI>
			<tei:teiHeader>
				<tei:fileDesc>
					<tei:titleStmt>
						<tei:title>
							<xsl:value-of select="$title" />
						</tei:title>
						<tei:author>
							<xsl:value-of select="$author" />
						</tei:author>
					</tei:titleStmt>
					<tei:publicationStmt>
						<tei:p>
							<xsl:value-of select="$publication" />
						</tei:p>
					</tei:publicationStmt>
					<tei:sourceDesc>
						<tei:listPerson>
							<!-- https://stackoverflow.com/questions/2291567/how-to-use-xslt-to-create-distinct-values -->
							<xsl:for-each
								select="//html:span[contains(@class, 'person')]/@about[generate-id() = generate-id(key('persons', .)[1])]">
								<tei:person xml:id="{current()}">
									<xsl:variable name="label" select="//html:span[@data-label and @about = current()]/@data-label" />
									<xsl:apply-templates
										select="//html:span[@about = current() and text()[generate-id() = generate-id(key('innerStrings', .)[1])]]"
										mode="inner">
										<xsl:with-param name="label" select="$label" />
									</xsl:apply-templates>
									<xsl:apply-templates select="//html:span[@data-sort and @about = current()][1]" mode="sort" />
									<xsl:apply-templates select="//html:span[@data-wikidata-id and @about = current()][1]" mode="wiki"
									 />
								</tei:person>
							</xsl:for-each>
						</tei:listPerson>
						<tei:listOrg>
							<xsl:for-each
								select="//html:span[contains(@class, 'organization')]/@about[generate-id() = generate-id(key('organizations', .)[1])]">
								<tei:org xml:id="{current()}">
									<xsl:variable name="label" select="//html:span[@data-label and @about = current()]/@data-label" />
									<xsl:apply-templates
										select="//html:span[@about = current() and text()[generate-id() = generate-id(key('innerStrings', .)[1])]]"
										mode="inner">
										<xsl:with-param name="label" select="$label" />
									</xsl:apply-templates>
									<xsl:apply-templates select="//html:span[@data-sort and @about = current()][1]" mode="sort" />
									<xsl:apply-templates select="//html:span[@data-wikidata-id and @about = current()][1]" mode="wiki"
									 />
								</tei:org>
							</xsl:for-each>
						</tei:listOrg>
						<tei:listPlace>
							<xsl:for-each
								select="//html:span[contains(@class, 'place')]/@about[generate-id() = generate-id(key('places', .)[1])]">
								<tei:place xml:id="{current()}">
									<xsl:variable name="label" select="//html:span[@data-label and @about = current()]/@data-label" />
									<xsl:apply-templates
										select="//html:span[@about = current() and text()[generate-id() = generate-id(key('innerStrings', .)[1])]]"
										mode="inner">
										<xsl:with-param name="label" select="$label" />
									</xsl:apply-templates>
									<xsl:apply-templates select="//html:span[@data-sort and @about = current()][1]" mode="sort" />
									<xsl:apply-templates select="//html:span[@data-wikidata-id and @about = current()][1]" mode="wiki"
									 />
								</tei:place>
							</xsl:for-each>
						</tei:listPlace>
					</tei:sourceDesc>
				</tei:fileDesc>
			</tei:teiHeader>
			<tei:text>
				<tei:body>
					<xsl:apply-templates />
				</tei:body>
			</tei:text>
		</tei:TEI>
	</xsl:template>

    <xsl:template match="*">
        <xsl:element name="{local-name()}">
            <xsl:apply-templates select="@*|node()"/>
        </xsl:element>
    </xsl:template>

	<xsl:template match="@*">
		<xsl:copy>
			<xsl:value-of select="." />
		</xsl:copy>
	</xsl:template>

	<xsl:template match="@id">
		<xsl:attribute name="xml:id">
			<xsl:value-of select="." />
		</xsl:attribute>
	</xsl:template>

	<xsl:template match="html:div[@id = 'file']">
		<tei:div xml:id="work">
			<xsl:apply-templates />
		</tei:div>
	</xsl:template>
	<xsl:template match="html:div[@id = 'intro-note']">
		<tei:div xml:id="intro-note">
			<xsl:apply-templates />
		</tei:div>
	</xsl:template>
	<xsl:template match="html:div | html:section">
		<tei:div>
			<xsl:apply-templates />
		</tei:div>
	</xsl:template>
	<xsl:template match="html:p | html:figcaption | html:blockquote">
		<tei:p>
			<xsl:apply-templates />
		</tei:p>
	</xsl:template>
	<xsl:template match="html:h1 | html:h2 | html:h3 | html:h4 | html:p[contains(@class,'subtitle')]">
		<tei:head>
			<xsl:apply-templates />
		</tei:head>
	</xsl:template>

	<xsl:template match="html:p[contains(@class, 'byline')]">
		<tei:byline>
			<xsl:apply-templates />
		</tei:byline>
	</xsl:template>

	<xsl:template match="html:i">
		<tei:span rend="italic">
			<xsl:apply-templates />
		</tei:span>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'person')]">
		<tei:persName ref="#{@about}">
			<xsl:apply-templates />
		</tei:persName>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'organization')]">
		<tei:orgName ref="#{@about}">
			<xsl:apply-templates />
		</tei:orgName>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'place')]">
		<tei:placeName ref="#{@about}">
			<xsl:apply-templates />
		</tei:placeName>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'bib')]">
		<tei:bibl>
			<xsl:apply-templates />
		</tei:bibl>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'quote')]">
		<tei:quote>
			<xsl:apply-templates />
		</tei:quote>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'person')]" mode="inner">
		<xsl:param name="label"/>
		<xsl:choose>
		  <xsl:when test="./text() = $label">
				<tei:persName>
					<xsl:value-of select="." />
				</tei:persName>
		  </xsl:when>
		  <xsl:when test="./text() != $label">
				<tei:persName>
					<tei:addName>
						<xsl:value-of select="." />
					</tei:addName>
				</tei:persName>
		  </xsl:when>
		  <xsl:otherwise>
				<tei:persName>
						<xsl:value-of select="." />
				</tei:persName>
		  </xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="html:span[contains(@class, 'organization')]" mode="inner">
		<xsl:param name="label"/>
		<xsl:choose>
		  <xsl:when test="./text() = $label">
				<tei:orgName>
					<xsl:value-of select="." />
				</tei:orgName>
		  </xsl:when>
		  <xsl:when test="./text() != $label">
				<tei:orgName>
					<tei:addName>
						<xsl:value-of select="." />
					</tei:addName>
				</tei:orgName>
		  </xsl:when>
		  <xsl:otherwise>
				<tei:orgName>
						<xsl:value-of select="." />
				</tei:orgName>
		  </xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="html:span[contains(@class, 'place')]" mode="inner">
		<xsl:param name="label"/>
		<xsl:choose>
		  <xsl:when test="./text() = $label">
				<tei:placeName>
					<xsl:value-of select="." />
				</tei:placeName>
		  </xsl:when>
		  <xsl:when test="./text() != $label">
				<tei:placeName>
					<tei:addName>
						<xsl:value-of select="." />
					</tei:addName>
				</tei:placeName>
		  </xsl:when>
		  <xsl:otherwise>
				<tei:placeName>
						<xsl:value-of select="." />
				</tei:placeName>
		  </xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="html:span" mode="wiki">
		<tei:idno type="Wikidata">https://www.wikidata.org/wiki/<xsl:value-of select="./@data-wikidata-id" /></tei:idno>
	</xsl:template>
	<xsl:template match="html:span" mode="sort">
		<tei:idno type="sortValue">
			<xsl:value-of select="./@data-sort" />
		</tei:idno>
	</xsl:template>
	
	<xsl:template match="html:style"/>
	
</xsl:stylesheet>
