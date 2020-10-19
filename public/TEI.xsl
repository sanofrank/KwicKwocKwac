<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:html="http://www.w3.org/1999/xhtml"
	xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns="http://www.tei-c.org/ns/1.0" exclude-result-prefixes="tei html">

	<xsl:param name="title">No title</xsl:param>
	<xsl:param name="publication">No publication details</xsl:param>
	<xsl:param name="source">No source details</xsl:param>
	<xsl:param name="authority">Edizione nazionale delle opere di Aldo Moro</xsl:param>
	<xsl:param name="author">Aldo Moro</xsl:param>

	<xsl:output encoding="UTF-8" indent="yes" method="xml" />
	<xsl:key name="persons" match="html:span[contains(@class, 'person')]/@about" use="." />
	<xsl:key name="organizations" match="html:span[contains(@class, 'organization')]/@about" use="." />
	<xsl:key name="places" match="html:span[contains(@class, 'place')]/@about" use="." />
	<xsl:key name="bibref" match="html:span[contains(@class, 'bib')]/@about" use="." />
	<xsl:key name="quotes" match="html:span[contains(@class, 'quote')]/@about" use="." />
	<xsl:key name="innerStrings" match="html:span[contains(@class, 'mention')]/text()" use="." />

	<xsl:template match="/">
		<tei:TEI xmlns="http://www.tei-c.org/ns/1.0">
			<tei:teiHeader>
				<tei:fileDesc>
					<tei:titleStmt>
						<tei:title>
							<xsl:value-of select="$title" />
						</tei:title>
						<tei:author role="">
							<xsl:value-of select="$author" />
						</tei:author>
						<tei:principal>
						</tei:principal>
					</tei:titleStmt>
					<tei:publicationStmt>
						<tei:authority>
							<xsl:value-of select="$authority" />
						</tei:authority>
						<tei:idno>
						</tei:idno>
					</tei:publicationStmt>
					<tei:sourceDesc>
						<tei:list>
						</tei:list>
						<tei:listPerson>
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
				<tei:encodingDesc>
					<tei:tagsDecl partial="true">
						<tei:namespace name="http://www.tei-c.org/ns/1.0">
							<tei:tagUsage gi="author">
								<tei:classSpec type="atts">
									<tei:attList>
										<tei:attDef ident="role">
											<tei:valList>
												<tei:valItem ident="role.01">
													<tei:gloss>Delegato Aspirante della Gioventù Cattolica</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.02">
													<tei:gloss>Studente</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.03">
													<tei:gloss>Membro della FUCI</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.04">
													<tei:gloss>Presidente del circolo di Bari della FUCI</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.05">
													<tei:gloss>Assistente volontario alla cattedra di diritto e procedura penale</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.06">
													<tei:gloss>Presidente nazionale della FUCI</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.07">
													<tei:gloss>Professore di Filosofia del Diritto</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.08">
													<tei:gloss>Membro del Movimento Laureati dell’Azione Cattolica</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.09">
													<tei:gloss>Membro dell’Ufficio stampa del governo Badoglio</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.10">
													<tei:gloss>Giornalista e commentatore politico</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.11">
													<tei:gloss>Presidente del Comitato direttivo provvisorio per la FUCI meridionale</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.12">
													<tei:gloss>Segretario Centrale del Movimento Laureati dell’Azione Cattolica</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.13">
													<tei:gloss>Direttore di “Studium”</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.14">
													<tei:gloss>Membro dell’Assemblea Costituente</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.15">
													<tei:gloss>Vicepresidente del gruppo democristiano alla Costituente</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.16">
													<tei:gloss>Membro della Camera dei Deputati</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.17">
													<tei:gloss>Sottosegretario al ministero degli Affari Esteri con delega per l’Emigrazione</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.18">
													<tei:gloss>Membro dell’Unione Giuristi Cattolici</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.19">
													<tei:gloss>Membro di Iniziativa Democratica</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.20">
													<tei:gloss>Professore di diritto penale</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.21">
													<tei:gloss>Professore di diritto e procedura penale</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.22">
													<tei:gloss>Membro della Commissione parlamentare di esame del disegno di legge relativo alla co-stituzione e al funzionamento della Corte Costituzionale</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.23">
													<tei:gloss>Presidente del gruppo DC alla Camera</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.24">
													<tei:gloss>Ministro di Grazia e Giustizia</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.25">
													<tei:gloss>Consigliere nazionale della DC</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.26">
													<tei:gloss>Ministro della Pubblica Istruzione</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.27">
													<tei:gloss>Segretario politico della DC</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.28">
													<tei:gloss>Presidente del Consiglio</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.29">
													<tei:gloss>Titolare ad interim del ministero degli Esteri</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.30">
													<tei:gloss>Ministro degli Esteri</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.31">
													<tei:gloss>Presidente della Commissione Affari Esteri della Camera</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.32">
													<tei:gloss>Presidente di turno della Comunità Europea</tei:gloss>
												</tei:valItem>
												<tei:valItem ident="role.33">
													<tei:gloss>Presidente del Consiglio Nazionale della DC</tei:gloss>
												</tei:valItem>
											</tei:valList>
										</tei:attDef>
									</tei:attList>
								</tei:classSpec>
							</tei:tagUsage>
						</tei:namespace>
					</tei:tagsDecl>
					<tei:classDecl>
						<tei:taxonomy xml:id="doctype">
							<tei:category xml:id="doctype.01">
								<tei:catDesc>Articolo su periodico</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.02">
								<tei:catDesc>Articolo su quotidiano</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.03">
								<tei:catDesc>Comunicato stampa</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.04">
								<tei:catDesc>Discorso in sede pubblica/Comizio</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.05">
								<tei:catDesc>Documento interno</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.06">
								<tei:catDesc>Intervento di partito</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.07">
								<tei:catDesc>Intervento in sede parlamentare</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.08">
								<tei:catDesc>Intervento istituzionale</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.09">
								<tei:catDesc>Intervento radiofonico/televisivo</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.10">
								<tei:catDesc>Intervista</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.11">
								<tei:catDesc>Lezione universitaria</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.12">
								<tei:catDesc>Libro/intervento in libro</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctype.13">
								<tei:catDesc>Opuscolo</tei:catDesc>
							</tei:category>               
						</tei:taxonomy>
						<tei:taxonomy xml:id="doctopic">
							<tei:category xml:id="doctopic.01">
								<tei:catDesc>Chiesa</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.02">
								<tei:catDesc>Cultura/Istruzione</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.03">
								<tei:catDesc>Diritto</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.04">
								<tei:catDesc>Partito</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.05">
								<tei:catDesc>Politica interna</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.06">
								<tei:catDesc>Politica internazionale</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.07">
								<tei:catDesc>Religione</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.08">
								<tei:catDesc>Società</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.09">
								<tei:catDesc>Stato</tei:catDesc>
							</tei:category>
							<tei:category xml:id="doctopic.10">
								<tei:catDesc>Vita locale</tei:catDesc>
							</tei:category>
						</tei:taxonomy>
					</tei:classDecl>
				</tei:encodingDesc>
				<tei:profileDesc>
					<tei:abstract>
					</tei:abstract>
					<tei:textClass>
						<tei:catRef xml:id="documentType" scheme="#doctype" target="" />
						<tei:catRef xml:id="documentTopic" scheme="#doctopic" target="" />
					</tei:textClass>
					<tei:creation>
					</tei:creation>
				</tei:profileDesc>
				<tei:revisionDesc status="">
					<tei:change>
						<xsl:value-of select="$publication" />
					</tei:change>
				</tei:revisionDesc>
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

	<xsl:template match="html:i|html:em">
		<tei:span rend="italic">
			<xsl:apply-templates />
		</tei:span>
	</xsl:template>

	<xsl:template match="html:b|html:strong">
		<tei:span rend="bold">
			<xsl:apply-templates />
		</tei:span>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'person')]">
		<xsl:choose>
			<xsl:when test="@data-rs">
				<tei:rs ref="#{@data-rs}" type="person">
					<xsl:apply-templates />
				</tei:rs>
			</xsl:when>
			<xsl:otherwise>
				<tei:persName ref="#{@about}">
					<xsl:apply-templates />
				</tei:persName>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'organization')]">
		<xsl:choose>
			<xsl:when test="@data-rs">
				<tei:rs ref="#{@data-rs}" type="organization">
					<xsl:apply-templates />
				</tei:rs>
			</xsl:when>
			<xsl:otherwise>
				<tei:orgName ref="#{@about}">
					<xsl:apply-templates />
				</tei:orgName>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'place')]">
		<xsl:choose>
			<xsl:when test="@data-rs">
				<tei:rs ref="#{@data-rs}" type="place">
					<xsl:apply-templates />
				</tei:rs>
			</xsl:when>
			<xsl:otherwise>
				<tei:placeName ref="#{@about}">
					<xsl:apply-templates />
				</tei:placeName>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'bib')]">
		<tei:bibl xml:id="{@id}">
			<xsl:apply-templates />
		</tei:bibl>
	</xsl:template>

	<xsl:template match="html:span[contains(@class, 'quote')]">
		<xsl:variable name="count"> <!--count variable generating document order ID-->
    		<xsl:number/>
		</xsl:variable>
		<tei:cit xml:id="quote-{$count}">
			<xsl:apply-templates />
		</tei:cit>
	</xsl:template>

	<!--<xsl:template match="html:span[contains(@class, 'quote')]">
		<tei:cit xml:id="{@id}">
			<xsl:apply-templates />
		</tei:cit>
	</xsl:template>-->

	<xsl:template match="html:span[contains(@class, 'quote-text')]">
		<tei:quote>
			<xsl:apply-templates />
		</tei:quote>
	</xsl:template>

	<xsl:template match="html:sup">
		<xsl:apply-templates />
	</xsl:template>

	<xsl:template match="html:li[contains(@data-owner, 'curator')]">
		<tei:note xml:id='{@id}' place='bottom' type='footnote' subtype='curator-note'>
			<xsl:apply-templates />
		</tei:note>
	</xsl:template>

	<xsl:template match="html:li[contains(@data-owner, 'AldoMoro')]">
		<tei:note xml:id='{@id}' place='bottom' type='footnote' subtype='moro-note'>
			<xsl:apply-templates />
		</tei:note>
	</xsl:template>

	<xsl:template match="html:a">
		<tei:ref target="{@href}">
			<xsl:apply-templates />
		</tei:ref>
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
