// Author : Romain Valeri (romain.valeri@laposte.net)
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// ------ OBJETS DU GENERATEUR DE PHRASES (Phrase, Grimoire et Generateur) --------

function Phrase(options) {

	this.lire = function () {
		return this.corps;
	};

	this.__assembler = function (texte) {
		var resultat = texte.join(" ");
		var point = probaSwitch(Grimoire.recupererListe("PF"), this.PROBA_POINT_FINAL);
		resultat = resultat.replace(/ \,/g, ",");
		resultat = resultat.replace(/' /g, "'");
		resultat = resultat.replace(/à les /g, "aux ");
		resultat = resultat.replace(/à le /g, "au ");
		resultat = resultat.replace(/ de ([aeiouhéèêàùäëïöü])/gi, " d'$1");
		resultat = resultat.replace(/ de les /g, " des ");
		resultat = resultat.replace(/ de de(s)? ([aeiouéèêàîïùyh])/gi, " d'$2");
		resultat = resultat.replace(/ de de(s)? ([^aeiouéèêàîïùyh])/gi, " de $2");
		resultat = resultat.replace(/ de d'/g, " d'");
		resultat = resultat.replace(/ de (le|du) /g, " du ");
		resultat = resultat.replace(/^(.*)je ([aeiouéèêàîïùyh])/i, "$1j'$2");
		resultat = resultat.replace(/£/g, "h").replace(/µ/g, "Y");
		resultat = resultat.substr(0, 1).toUpperCase() + resultat.substr(1) + point;
		return resultat;
	};

	options || (options = {});
	this.PROBA_POINT_FINAL = [8, 1, 1];

	this.structure = options.memeStr || Grimoire.genererStructure();
	this.mots = [];

	var posVerbe = -1, posVerbe2 = -1, posModal = -1, posDe = -1, posQue = -1, posPR = -1;
	var personne = 0, temps = -1;
	var premierGN = false, advPost = false, flagNoNeg = false;

	/* --- BOUCLE SUR LES BLOCS DE LA STRUCTURE --- */
	for (var i = 0, iMax = this.structure.length; i < iMax; ++i) {
		if (this.structure[i].substr(0, 1) == "§") {
			var litteral = this.structure[i].substr(1);
			if (litteral.indexOf("/") > -1) {
				litteral = litteral.split("/")[(de(2) - 1)];
			}
			this.mots.push(litteral);
			if (litteral == "sans") {
				flagNoNeg = true;
			}
		} else {
			var mot;
			if (this.structure[i] == "GN") {
				if (options.sujetChoisi && !premierGN) {
					mot = options.sujetChoisi;
				} else {
					if (de(11) > 1) {
						mot = Generateur.groupeNominal(premierGN);
					} else {
						mot = Grimoire.recupererMot(this.structure[i]);
					}
				}
				premierGN = true;
			} else if (this.structure[i] == "CO") {
				if (de(11) > 1) {
					mot = Generateur.complementObjet(personne);
				} else {
					mot = Grimoire.recupererMot(this.structure[i]);
				}
			} else {
				mot = Grimoire.recupererMot(this.structure[i]);
			}
			var posPersonne = mot.indexOf("@");
			if (posPersonne > -1) {
				personne = (personne > 0) ? personne : parseInt(mot.substr(posPersonne + 1), 10);
				mot = mot.substr(0, posPersonne);
			}
			this.mots.push(mot);
		}
		var verbesNonMod = ["VT", "VN", "VOA", "VOD", "VOI", "VTL", "VAV", "VET", "VOS"];
		var verbesMod = ["VM", "VD", "VA"];
		if (verbesNonMod.indexOf(this.structure[i]) > -1) {
			if (posVerbe > -1) {
				if (posModal > -1) {
					posVerbe2 = i;
				} else {
					posModal = posVerbe;
					posVerbe = i;
				}
			} else {
				posVerbe = i;
			}
		}
		if (verbesMod.indexOf(this.structure[i]) > -1) {
			posModal = i;
		}
		if (this.structure[i] == "§que") {
			posQue = i;
		}
		if (this.structure[i] == "CT") {
			var posTemps = this.mots[i].indexOf("€");
			if (posTemps > -1) {
				temps = parseInt(this.mots[i].substr(posTemps + 1), 10);
				this.mots[i] = this.mots[i].substr(0, posTemps);
			}
			while (this.mots[i].indexOf("$") > -1) {
				var nom;
				do {
					nom = Generateur.GN.nomsPropres.puiser().replace(/_F/, "");
				} while (this.mots[i].indexOf(nom) > -1);
				this.mots[i] = this.mots[i].replace(/\$/, nom);
			}
			this.mots[i] = this.mots[i].replace(/ de ([aeiouyhéèâ])/gi, " d'$1");

		}
		if ((this.structure[i] == "CL") || (this.structure[i] == "AF")) {
			while (this.mots[i].indexOf("$") > -1) {
				var nom;
				do {
					nom = Generateur.GN.nomsPropres.puiser().replace(/_F/, "");
				} while (this.mots[i].indexOf(nom) > -1);
				this.mots[i] = this.mots[i].replace(/\$/, nom);
			}
			this.mots[i] = this.mots[i].replace(/ de ([aeiouyhéèâ])/gi, " d'$1");

			while (this.mots[i].indexOf("+") > -1) {
				var posPlus = this.mots[i].indexOf("+");
				var fem = this.mots[i].charAt(posPlus + 1) == "F";

				var nom, ok;
				do {
					ok = true;
					nom = Generateur.GN.nomsCommuns.puiser();
					if (nom.indexOf("_") > -1) {
						var pos = nom.indexOf("_");
						var genre = nom.charAt(pos + 1);
						if (!fem && (genre == "F") || (fem && genre == "H")) {
							ok = false;
						} else {
							nom = nom.split("_")[0];
						}
					} else {
						var pos = nom.indexOf("%");
						if (nom.substr(pos + 1).length == 1) {
							nom = nom.replace(/(.*)%e/, "$1%$1e");
						}
						nom = nom.split("%")[((fem) ? 1 : 0)];
					}
				} while ((!ok) || (nom === undefined));
				nom = Generateur.accordPluriel(nom, false);
				this.mots[i] = this.mots[i].replace(/\+[FH]/, nom);
			}

			this.mots[i] = this.mots[i].replace(/ de ([aeiouyhéèâ])/gi, " d'$1");
		}
		if ((this.structure[i] == "CL") || (this.structure[i] == "CT") || (this.structure[i] == "AF")) {
			var nombre;
			while (this.mots[i].indexOf("&") > -1) {
				nombre = de(10) + 1;
				if (this.mots[i].indexOf("&0") > -1) {
					nombre = (nombre * 10) - 10;
				}
				if (this.mots[i].indexOf("&00") > -1) {
					nombre *= 10;
				}
				nombre = nombre.enLettres();
				this.mots[i] = this.mots[i].replace(/&(0){0,2}/, nombre);
			}
		}
		if (this.structure[i].split("_")[0] == "PR") {
			posPR = i;
		}
	}
	/* --- FIN DE LA BOUCLE SUR LES BLOCS DE LA STRUCTURE --- */
	if (temps == -1)
		temps = (de(2) > 1) ? 2 : de(3);

	if (posQue > -1) {
		this.mots[posQue] = (this.mots[posQue + 1].voyelle()) ? "qu'" : "que";
	}
	if (posPR > -1) {
		var tPers = 2;
		if ((/^s(\'|e )/).test(this.mots[posPR])) {
			tPers = [2, personne];
		}
		var neg1 = "", neg2 = "";
		if ((!flagNoNeg) && (de(9) > 8)) {
			neg1 = (this.mots[posPR].voyelle()) ? "n'" : "ne ";
			neg2 = " " + probaSwitch(Grimoire.recupererListe("NG"), Grimoire.PROBA_NEGATIONS);
		}
		this.mots[posPR] = "en " + neg1 + Grimoire.conjuguer(this.mots[posPR], 4, tPers) + neg2;
	}

	if (posModal > -1) {
		var baseVerbe = Grimoire.conjuguer(this.mots[posModal], temps, personne);
		if (!flagNoNeg && !advPost && (de(11) > 10)) {
			var voyelle = baseVerbe.voyelle();
			var neg = probaSwitch(Grimoire.recupererListe("NG"), Grimoire.PROBA_NEGATIONS);
			baseVerbe = ((voyelle) ? "n'" : "ne ") + baseVerbe + " " + neg;
		}
		this.mots[posModal] = baseVerbe;

		if (this.mots[posVerbe].indexOf("#") > -1) {
			this.mots[posVerbe] = this.mots[posVerbe].split("#")[0];
		}
		if (((personne % 3) != 0) && (/^s(\'|e )/).test(this.mots[posVerbe])) {
			var pr = Grimoire.pronomsReflexifs[personne - 1] + " ";
			if ((this.mots[posVerbe].indexOf("'") > -1) && (personne < 3)) {
				pr = pr.replace(/e /, "'");
			}
			this.mots[posVerbe] = this.mots[posVerbe].replace(/s(\'|e )/, pr);
		}
		if (!flagNoNeg && (de(11) > 10)) {
			var neg2 = probaSwitch(Grimoire.recupererListe("NG"), Grimoire.PROBA_NEGATIONS);
			this.mots[posVerbe] = "ne " + neg2 + " " + this.mots[posVerbe];
		}
		if (posVerbe2 > -1) {
			if (this.mots[posVerbe2].indexOf("#") > -1) {
				this.mots[posVerbe2] = this.mots[posVerbe2].split("#")[0];
			}
			if (((personne % 3) != 0) && (/^s(\'|e )/).test(this.mots[posVerbe2])) {
				var pr = Grimoire.pronomsReflexifs[personne - 1] + " ";
				if ((this.mots[posVerbe2].indexOf("'") > -1) && (personne < 3)) {
					pr = pr.replace(/e /, "'");
				}
				this.mots[posVerbe2] = this.mots[posVerbe2].replace(/s(\'|e )/, pr);
			}
			if (!flagNoNeg && (de(11) > 10)) {
				var neg2 = probaSwitch(Grimoire.recupererListe("NG"), Grimoire.PROBA_NEGATIONS);
				this.mots[posVerbe2] = "ne " + neg2 + " " + this.mots[posVerbe2];
			}
		}
	} else if (posVerbe > -1) {
		var baseVerbe = Grimoire.conjuguer(this.mots[posVerbe], temps, personne);
		if (baseVerbe === undefined)
			return new Phrase(options);// et sa copine
		if (!flagNoNeg && !advPost && (de(11) > 10)) {
			var voyelle = baseVerbe.voyelle();
			var neg = probaSwitch(Grimoire.recupererListe("NG"), Grimoire.PROBA_NEGATIONS);
			baseVerbe = ((voyelle) ? "n'" : "ne ") + baseVerbe + " " + neg;
		}
		this.mots[posVerbe] = baseVerbe;
	}

	this.corps = this.__assembler(this.mots);
	return this;
}

function _GRIMOIRE_() { /* pour structurer la liste des functions dans NotePad++ */
}

var Grimoire = {
	genererStructure: function () {
		var str = [];
		var flagModal = false, flagCT = false, flagCL = false, flagAP = false;

		if (de(100) < 9) {
			if (de(100) < 50) {
				str.push("CT");
				flagCT = true;
			} else {
				str.push("CL");
				flagCL = true;
			}
			str.push("VG");
		}

		str.push("GN");

		if (de(100) < 24) {
			var tirageModal = de(100);
			if (tirageModal < 51) {
				str.push("VM");
			} else if (tirageModal < 76) {
				str.push("VD");
				str.push("§de");
			} else {
				str.push("VA");
				str.push("§à");
			}
			flagModal = true;

			if (de(100) < 5) {
				str.push("AP");
				flagAP = true;
			}
		}

		var verbesNonMod = ["VT", "VN", "VOA", "VOD", "VOI", "VTL", "VAV", "VET", "VOS"];
		var probasVerbes = [5, 5, 2, 2, 2, 2, 1, 1, 1];
		var verbe;
		do {
			verbe = probaSwitch(verbesNonMod, probasVerbes);
		} while ((flagCL) && (verbe == "VTL"));
		str.push(verbe);

		var seuilAP = (flagAP) ? 2 : 5;
		if (de(100) < seuilAP) {
			str.push("AP");
			flagAP = true;
		}

		switch (verbe) {
			case "VT":
				str.push((de(4) > 1) ? "CO" : "GN");
				break;
			case "VTL":
				str.push("CL");
				flagCL = true;
				break;
			case "VOA":
				str.push("§à");
				str.push((de(4) > 1) ? "CO" : "GN");
				break;
			case "VOD":
				str.push("§de");
				str.push((de(4) > 1) ? "CO" : "GN");
				break;
			case "VOS":
				str.push("§sur");
				str.push((de(4) > 1) ? "CO" : "GN");
				break;
			case "VOI":
				str.push((de(11) > 1) ? "CO" : "GN");
				str.push("§à");
				str.push((de(11) > 1) ? "GN" : "CO");
				break;
			case "VAV":
				str.push((de(5) > 1) ? "CO" : "GN");
				str.push("§avec");
				str.push((de(5) > 1) ? "CO" : "GN");
				break;
			case "VET":
				str.push((de(5) > 1) ? "CO" : "GN");
				str.push("§et");
				str.push((de(5) > 1) ? "CO" : "GN");
				break;
		}

		if (de(100) < 20) {
			var tirageVerbeSuite = de(100);
			if (tirageVerbeSuite < 25) {
				str.push("PR_N");
				seuilAP = (flagAP) ? 2 : 5;
				if (de(100) < seuilAP) {
					str.push("AP");
					flagAP = true;
				}
			} else if (tirageVerbeSuite < 50) {
				str.push("PR_T");
				seuilAP = (flagAP) ? 2 : 5;
				if (de(100) < seuilAP) {
					str.push("AP");
					flagAP = true;
				}
				str.push((de(4) > 1) ? "CO" : "GN");
			} else {
				str.push((tirageVerbeSuite < 75) ? "§sans" : "§pour");
				do {
					verbe = probaSwitch(verbesNonMod, probasVerbes);
				} while ((flagCL) && (verbe == "VTL"));
				str.push(verbe);

				seuilAP = (flagAP) ? 2 : 5;
				if (de(100) < seuilAP) {
					str.push("AP");
					flagAP = true;
				}

				switch (verbe) {
					case "VT":
						str.push((de(4) > 1) ? "CO" : "GN");
						break;
					case "VTL":
						str.push("CL");
						flagCL = true;
						break;
					case "VOA":
						str.push("§à");
						str.push((de(4) > 1) ? "CO" : "GN");
						break;
					case "VOD":
						str.push("§de");
						str.push((de(4) > 1) ? "CO" : "GN");
						break;
					case "VOS":
						str.push("§sur");
						str.push((de(4) > 1) ? "CO" : "GN");
						break;
					case "VOI":
						str.push((de(11) > 1) ? "CO" : "GN");
						str.push("§à");
						str.push((de(11) > 1) ? "CO" : "GN");
						break;
					case "VAV":
						str.push((de(5) > 1) ? "CO" : "GN");
						str.push("§avec");
						str.push((de(5) > 1) ? "CO" : "GN");
						break;
					case "VET":
						str.push((de(5) > 1) ? "CO" : "GN");
						str.push("§et");
						str.push((de(5) > 1) ? "CO" : "GN");
						break;
				}
			}
		}

		if (de(100) < 12) {
			var optionsFin = ["CT", "CL", "AF"];
			var probasFin = [3, 3, 5];
			var fin;
			do {
				fin = probaSwitch(optionsFin, probasFin);
			} while (((flagCT) && (fin == "CT")) || ((flagCL) && (fin == "CL")));
			str.push(fin);
		}

		for (var i = 0, iMax = str.length; i < iMax; ++i) {
			if (str[i] == "AP") {
				if (str[i - 1].substr(0, 1) == "§") {
					str[i] = str[i - 1];
					str[i - 1] = "AP";
				}
			}
		}

		return str;
	},

	listerStructures: function () {
		var liste = [];
		var proto;

		for (var i = 0, iMax = 3; i < iMax; ++i) {// 3 cas : [CT, VG, GN] ou [CL, VG, GN] ou [GN]
			proto = [];
			switch (i) {
				case 0:
					proto.push("CT");
					proto.push("VG");
					break;
				case 1:
					proto.push("CL");
					proto.push("VG");
					break;
			}
			proto.push("GN");
			liste.push(proto);
		}

		var memListe = liste.cloner();
		liste = [];
		// 1 cas par verbe modal possible (ou absence de modal)(+ 3 pour les éventuels AP)(total : 7)
		for (var i = 0, iMax = 7; i < iMax; ++i) {
			proto = memListe.cloner();
			switch (i) {
				case 0:
					proto.pushEach("VM");
					break;
				case 1:
					proto.pushEach("VD", "§de");
					break;
				case 2:
					proto.pushEach("VA", "§à");
					break;
				case 3:
					proto.pushEach("VM", "AP");
					break;
				case 4:
					proto.pushEach("VD", "AP", "§de");
					break;
				case 5:
					proto.pushEach("VA", "AP", "§à");
					break;
			}
			for (var j = 0, jMax = proto.length; j < jMax; ++j) {
				liste.push(proto[j]);
			}
		}

		memListe = liste.cloner();
		liste = [];
		// 1 cas par verbe principal possible (44 actuellement)
		for (var i = 0, iMax = 44; i < iMax; ++i) {
			proto = memListe.cloner();
			switch (i) {
				case 0:
					proto.pushEach("VN");
					break;
				case 1:
					proto.pushEach("VN", "AP");
					break;
				case 2:
					proto.pushEach("VT", "CO");
					break;
				case 3:
					proto.pushEach("VT", "GN");
					break;
				case 4:
					proto.pushEach("VT", "AP", "GN");
					break;
				case 5:
					proto.pushEach("VT", "AP", "CO");
					break;
				case 6:
					proto.pushEach("VTL", "CL");
					break;
				case 7:
					proto.pushEach("VTL", "AP", "CL");
					break;
				case 8:
					proto.pushEach("VOA", "§à", "CO");
					break;
				case 9:
					proto.pushEach("VOD", "§de", "CO");
					break;
				case 10:
					proto.pushEach("VOS", "§sur", "CO");
					break;
				case 11:
					proto.pushEach("VOA", "§à", "GN");
					break;
				case 12:
					proto.pushEach("VOD", "§de", "GN");
					break;
				case 13:
					proto.pushEach("VOS", "§sur", "GN");
					break;
				case 14:
					proto.pushEach("VOA", "AP", "§à", "CO");
					break;
				case 15:
					proto.pushEach("VOD", "AP", "§de", "CO");
					break;
				case 16:
					proto.pushEach("VOS", "AP", "§sur", "CO");
					break;
				case 17:
					proto.pushEach("VOA", "AP", "§à", "GN");
					break;
				case 18:
					proto.pushEach("VOD", "AP", "§de", "GN");
					break;
				case 19:
					proto.pushEach("VOS", "AP", "§sur", "GN");
					break;
				case 20:
					proto.pushEach("VOI", "CO", "§à", "GN");
					break;
				case 21:
					proto.pushEach("VOI", "CO", "§à", "CO");
					break;
				case 22:
					proto.pushEach("VOI", "GN", "§à", "GN");
					break;
				case 23:
					proto.pushEach("VOI", "GN", "§à", "CO");
					break;
				case 24:
					proto.pushEach("VOI", "AP", "CO", "§à", "GN");
					break;
				case 25:
					proto.pushEach("VOI", "AP", "CO", "§à", "CO");
					break;
				case 26:
					proto.pushEach("VOI", "AP", "GN", "§à", "GN");
					break;
				case 27:
					proto.pushEach("VOI", "AP", "CO", "§à", "CO");
					break;
				case 28:
					proto.pushEach("VET", "CO", "§et", "CO");
					break;
				case 29:
					proto.pushEach("VET", "GN", "§et", "CO");
					break;
				case 30:
					proto.pushEach("VET", "CO", "§et", "GN");
					break;
				case 31:
					proto.pushEach("VET", "GN", "§et", "GN");
					break;
				case 32:
					proto.pushEach("VET", "AP", "CO", "§et", "CO");
					break;
				case 33:
					proto.pushEach("VET", "AP", "GN", "§et", "CO");
					break;
				case 34:
					proto.pushEach("VET", "AP", "CO", "§et", "GN");
					break;
				case 35:
					proto.pushEach("VET", "AP", "GN", "§et", "GN");
					break;
				case 36:
					proto.pushEach("VAV", "CO", "§avec", "CO");
					break;
				case 37:
					proto.pushEach("VAV", "GN", "§avec", "CO");
					break;
				case 38:
					proto.pushEach("VAV", "CO", "§avec", "GN");
					break;
				case 39:
					proto.pushEach("VAV", "GN", "§avec", "GN");
					break;
				case 40:
					proto.pushEach("VAV", "AP", "CO", "§avec", "CO");
					break;
				case 41:
					proto.pushEach("VAV", "AP", "GN", "§avec", "CO");
					break;
				case 42:
					proto.pushEach("VAV", "AP", "CO", "§avec", "GN");
					break;
				case 43:
					proto.pushEach("VAV", "AP", "GN", "§avec", "GN");
					break;
			}
			for (var j = 0, jMax = proto.length; j < jMax; ++j) {
				liste.push(proto[j]);
			}
		}

		memListe = liste.cloner();
		liste = [];
		// 1 cas par type de proposition finale (rien / §sans / §pour / PR_T ... / PR_N) (total : 8 (+ N sous-cas dans §sans/pour))
		for (var i = 0, iMax = 7; i < iMax; ++i) {
			proto = memListe.cloner();
			switch (i) {
				case 0:
					proto.pushEach("PR_N");
					break;
				case 1:
					proto.pushEach("PR_N", "AP");
					break;
				case 2:
					proto.pushEach("PR_T", "CO");
					break;
				case 3:
					proto.pushEach("PR_T", "GN");
					break;
				case 4:
					proto.pushEach("PR_T", "AP", "CO");
					break;
				case 5:
					proto.pushEach("PR_T", "AP", "GN");
					break;
			}
			for (var j = 0, jMax = proto.length; j < jMax; ++j) {
				liste.push(proto[j]);
			}
		}

		var idx = 0;
		while (++idx <= 2) {
			// "repasser" dans la boucle des verbes principaux (+ AP) (+ objets)
			// 1 cas par verbe principal possible (44 actuellement)
			for (var k = 0, kMax = 44; k < kMax; ++k) {
				proto = memListe.cloner();
				proto.pushEach(((idx % 2) == 0) ? "§sans" : "§pour");
				switch (k) {
					case 0:
						proto.pushEach("VN");
						break;
					case 1:
						proto.pushEach("VN", "AP");
						break;
					case 2:
						proto.pushEach("VT", "CO");
						break;
					case 3:
						proto.pushEach("VT", "GN");
						break;
					case 4:
						proto.pushEach("VT", "AP", "GN");
						break;
					case 5:
						proto.pushEach("VT", "AP", "CO");
						break;
					case 6:
						proto.pushEach("VTL", "CL");
						break;
					case 7:
						proto.pushEach("VTL", "AP", "CL");
						break;
					case 8:
						proto.pushEach("VOA", "§à", "CO");
						break;
					case 9:
						proto.pushEach("VOD", "§de", "CO");
						break;
					case 10:
						proto.pushEach("VOS", "§sur", "CO");
						break;
					case 11:
						proto.pushEach("VOA", "§à", "GN");
						break;
					case 12:
						proto.pushEach("VOD", "§de", "GN");
						break;
					case 13:
						proto.pushEach("VOS", "§sur", "GN");
						break;
					case 14:
						proto.pushEach("VOA", "AP", "§à", "CO");
						break;
					case 15:
						proto.pushEach("VOD", "AP", "§de", "CO");
						break;
					case 16:
						proto.pushEach("VOS", "AP", "§sur", "CO");
						break;
					case 17:
						proto.pushEach("VOA", "AP", "§à", "GN");
						break;
					case 18:
						proto.pushEach("VOD", "AP", "§de", "GN");
						break;
					case 19:
						proto.pushEach("VOS", "AP", "§sur", "GN");
						break;
					case 20:
						proto.pushEach("VOI", "CO", "§à", "GN");
						break;
					case 21:
						proto.pushEach("VOI", "CO", "§à", "CO");
						break;
					case 22:
						proto.pushEach("VOI", "GN", "§à", "GN");
						break;
					case 23:
						proto.pushEach("VOI", "GN", "§à", "CO");
						break;
					case 24:
						proto.pushEach("VOI", "AP", "CO", "§à", "GN");
						break;
					case 25:
						proto.pushEach("VOI", "AP", "CO", "§à", "CO");
						break;
					case 26:
						proto.pushEach("VOI", "AP", "GN", "§à", "GN");
						break;
					case 27:
						proto.pushEach("VOI", "AP", "CO", "§à", "CO");
						break;
					case 28:
						proto.pushEach("VET", "CO", "§et", "CO");
						break;
					case 29:
						proto.pushEach("VET", "GN", "§et", "CO");
						break;
					case 30:
						proto.pushEach("VET", "CO", "§et", "GN");
						break;
					case 31:
						proto.pushEach("VET", "GN", "§et", "GN");
						break;
					case 32:
						proto.pushEach("VET", "AP", "CO", "§et", "CO");
						break;
					case 33:
						proto.pushEach("VET", "AP", "GN", "§et", "CO");
						break;
					case 34:
						proto.pushEach("VET", "AP", "CO", "§et", "GN");
						break;
					case 35:
						proto.pushEach("VET", "AP", "GN", "§et", "GN");
						break;
					case 36:
						proto.pushEach("VAV", "CO", "§avec", "CO");
						break;
					case 37:
						proto.pushEach("VAV", "GN", "§avec", "CO");
						break;
					case 38:
						proto.pushEach("VAV", "CO", "§avec", "GN");
						break;
					case 39:
						proto.pushEach("VAV", "GN", "§avec", "GN");
						break;
					case 40:
						proto.pushEach("VAV", "AP", "CO", "§avec", "CO");
						break;
					case 41:
						proto.pushEach("VAV", "AP", "GN", "§avec", "CO");
						break;
					case 42:
						proto.pushEach("VAV", "AP", "CO", "§avec", "GN");
						break;
					case 43:
						proto.pushEach("VAV", "AP", "GN", "§avec", "GN");
						break;
				}
				for (var m = 0, mMax = proto.length; m < mMax; ++m) {
					liste.push(proto[m]);
				}
			}
		}

		memListe = liste.cloner();
		liste = [];
		// 1 cas par fin possible (ou absence de fin)(total : 4)
		for (var i = 0, iMax = 4; i < iMax; ++i) {
			proto = memListe.cloner();
			switch (i) {
				case 0:
					proto.pushEach("AF");
					break;
				case 1:
					for (var j = 0, jMax = proto.length; j < jMax; ++j) {
						if (proto[j].indexOf("CL") == -1) {
							proto[j].push("CL");
						}
					}
					break;
				case 2:
				for (var j = 0, jMax = proto.length; j < jMax; ++j) {
					if (proto[j].indexOf("CT") == -1) {
						proto[j].push("CT");
					}
				}
			}
			for (var j = 0, jMax = proto.length; j < jMax; ++j) {
				liste.push(proto[j]);
			}
		}

		return liste;
	},

	decoderStructure: function (code) {
		var traduction;
		switch (code) {
			case "GN":
				traduction = "[quelqu'un]<hr/>sujet de la phrase, groupe ou individu";
				break;
			case "CO":
				traduction = "[quelque chose]<hr/>objet de l'action";
				break;
			case "CL":
				traduction = "[à tel endroit]<hr/>complément de lieu";
				break;
			case "CT":
				traduction = "[à tel moment]<hr/>complément de temps";
				break;
			case "AF":
				traduction = "[de telle manière]<hr/>complément de manière";
				break;
			case "AP":
				traduction = "[adverbe]<hr/>appliqué directement au verbe précédent";
				break;
			case "VG":
				traduction = "\",\"<hr/>(simple virgule)";
				break;
			case "VN":
				traduction = "[action (verbe intransitif)]<hr/>verbe n'ayant pas de complément d'objet";
				break;
			case "VT":
				traduction = "[action (verbe transitif)]<hr/>verbe d'action portant sur l'objet qui suit";
				break;
			case "VM":
				traduction = "[action (modal)]<hr/>soit un auxiliaire, soit un verbe modifiant le verbe suivant";
				break;
			case "VA":
				traduction = "[action (+ \"à\" + verbe)]<hr/>verbe appelant une construction avec \"à\" suivi d'un verbe";
				break;
			case "VD":
				traduction = "[action (+ \"de\" + verbe)]<hr/>verbe appelant une construction avec \"de\" suivi d'un verbe";
				break;
			case "VOI":
				traduction = "[action (+ objet + \"à\" + cible)]<hr/>verbe d'action nécessitant un objet plus \"à\" et une cible";
				break;
			case "VOA":
				traduction = "[action (+ \"à\" + objet)]<hr/>verbe appelant une construction avec \"à\" suivi d'un objet";
				break;
			case "VOD":
				traduction = "[action (+ \"de\" + objet)]<hr/>verbe appelant une construction avec \"de\" suivi d'un objet";
				break;
			case "VOS":
				traduction = "[action (+ \"sur\" + objet)]<hr/>verbe appelant une construction avec \"sur\" suivi d'un objet";
				break;
			case "VAV":
				traduction = "[action (+ objet + \"avec\" + objet)]<hr/>verbe appelant une construction avec 2 objets reliés par \"avec\"";
				break;
			case "VET":
				traduction = "[action (+ objet + \"et\" + objet)]<hr/>verbe appelant une construction avec 2 objets reliés par \"et\"";
				break;
			case "VTL":
				traduction = "[action (>>> lieu)]<hr/>verbe de déplacement ou de situation (donc suivi d'un lieu)";
				break;
			case "PR_T":
				traduction = "[2ème action (transitif)]<hr/>verbe d'action portant sur un objet (au participe présent)";
				break;
			case "PR_N":
				traduction = "[2ème action (intransitif)]<hr/>verbe n'ayant pas de complément d'objet (au participe présent)";
				break;
			default:
				traduction = "\"" + code.substr(1) + "\"<hr/>(nécessaire à la construction)";
		}
		return traduction;
	},

	lireStructure: function (saisie) {
		var format = /((GN|CO|CL|CT|VG|AP|AF|VT|VN|VOA|VOD|VOI|VTL|VAV|VET|VOS|VM|VA|VD|PR_N|PR_T|\§(c'est|à|de|sur|et|avec|sans|pour|que))(,|$)){2,}/;
		if (!format.test(saisie) || !(/GN/).test(saisie)) {
			console.log("La structure saisie est inconforme. Veuillez vérifier sa syntaxe.\nCe paramètre sera ignoré lors de la génération.");
			return false;
		}
		return saisie.split(",");
	},

	_LISTES_DU_GRIMOIRE_: function (bidon) { /* pour structurer la liste des functions dans NotePad++ */
	},

	sujets: ["un rat d'égout@3", "un inconnu@3", "tout le monde@3", "mes meilleurs amis@6", "quelques personnes@6", "ta mère@3", "le pape@3", "beaucoup de personnes@6", "la boulangère@3", "un flic@3", "le juge d'instruction@3", "ces gens-là@6@6", "un groupe de touristes@3", "la cohorte des musiciens de l'orchestre symphonique de Moscou@3", "un esprit froid@3", "le poulpe@3", "l'auteur du roman@3", "un drôle de type@3", "une femme superbe@3", "mon cousin@3", "le meilleur d'entre nous@3", "les coupables@6", "chaque citoyen français@3", "toute l'équipe@3", "les pompiers@6", "les personnes agées@6", "certains économistes@6", "la présentatrice de la météo@3", "un phacochère@3", "un enfant sur trois@3", "le pianiste@3", "ma soeur@3", "les dangereux malfaiteurs@6", "plusieurs dirigeants de l'OPEP@6", "certaines des meilleures candidates@6", "les plus ardents défenseurs de la paix@6", "les oiseaux migrateurs@6", "un rhinocéros adulte@3", "tous les chats du quartier@6", "le porte-parole du gouvernement@3", "un marin-pêcheur@3", "une secrétaire trilingue@3", "certaines femmes@6", "quelqu'un de bien@3", "le curé de la paroisse de Lunéville@3", "le doyen de l'université@3", "le champion de France de karaté@3", "un fou furieux@3", "l'arbitre@3", "les journalistes@6", "le syndicat des chauffeurs de bus@3", "mon chien@3", "ton chat@3", "les manifestants@6", "la police@3", "l'ensemble des castors du Nebraska@3", "un imam progressiste@3", "les apaches@6", "plusieurs évèques@6", "le roi de la piste@3", "la meilleure chanteuse de jazz de New York@3", "un autre homme@3", "cette femme complètement ivre@3", "le futur@3", "un journaliste sur cent@3", "le chef des pirates@3", "le patron@3", "la société française@3", "les grecs@6", "la foule des clients insatisfaits@3", "cette personne@3", "un meurtrier psychopathe@3", "l'adjoint au maire@3", "une brute épaisse@3", "le meilleur pizzaïolo d'Italie@3", "la remplaçante du facteur@3", "le personnage principal@3", "le cuisinier@3", "l'union des fabricants de mines anti-personnel@3", "le vainqueur de la course@3", "les cancres@6", "mes cousins@6", "les autistes@6", "un sourd-muet@3", "ce vieil aveugle@3", "les autorités@6", "quelques techniciens@6", "le personnel du supermarché@3", "l'employé du mois@3", "les meilleurs experts@6", "nos ancêtres@6", "les anorexiques@6", "la vendeuse de ballons@3", "un ouvrier du bâtiment@3", "quelqu'un@3", "les représentants de la CGT@6", "l'artiste@3", "un médecin@3", "les infirmières@6", "un fakir de quatre-vingt-dix ans@3", "l'armée du Pakistan@3", "les hauts gradés@6", "quelques sportifs amateurs@6", "un ogre@3", "le professeur de maths@3", "un clochard@3", "le prince charmant@3", "l'homme de ta vie@3", "la personne à laquelle je pense@3", "la personne dont tu m'as parlé@3", "l'ennemi public numéro un@3", "le dresseur de furets@3", "les taxidermistes@6", "le chauffeur du taxi@3", "ton copain plombier@3", "le pire des salauds@3", "un ingénieur informaticien@3", "le prochain candidat@3", "la plus belle@3", "ce mec@3", "le marchand de sable@3", "les femmes de ma vie@6", "ma meilleure amie@3", "un riche paysan@3", "mon client@3", "votre petit protégé@3", "la foule@3", "les gens@6", "Sa Majesté@3", "Madame@3", "cet abruti@3", "un passant@3", "le traitre@3", "les avocats@6", "ton interlocuteur@3", "le bourreau@3", "les victimes@6", "les allemands@6", "le dernier dandy@3", "le poète de la Mort@3", "les petits commerçants de mon quartier@6", "la racaille@3", "trente et un pour cent des travailleurs immigrés@6", "la femme idéale@3", "un célèbre architecte@3", "presque toutes les filles@6", "une âme en peine@3", "mes potes@6", "le spectre du passé@3", "un bon gars@3", "les deux ambulanciers@6", "celui qui nous manipule@3", "celle-là@3", "le capitaine@3", "un samouraï@3", "le champion du monde de sumo@3", "les alcooliques@6", "votre porte-parole@3", "le maire de Nancy@3", "la mafia@3", "les défenseurs de la laïcité@6", "le nouveau-né@3", "les enfants nés de père inconnu@6", "l'avocat du diable@3", "tes fameux spécialistes@6", "les douaniers@6", "la famille royale@3", "les pires escrocs@6", "le bouc émissaire@3", "une femme sur quatre@3", "les terroristes@6", "n'importe qui@3", "un bonze@3", "la bergère@3", "un tueur en série@3", "les éboueurs@6", "l'administration@3", "un animal sauvage@3", "le pire des agents immobiliers@3", "tous les démons de l'enfer@6", "le prix Nobel de chimie@3", "mon maître@3", "vos domestiques@6", "votre pharmacien-conseil@3", "vos parents@6", "le premier ministre ougandais@3", "Google@3", "Microsoft@3", "la France@3", "les Etats-Unis@6", "la Lybie@3", "le Honduras@3", "la Corée du Nord@3", "le gouvernement du Pakistan@3", "le Mozambique@3", "la Chine@3", "le Japon@3", "le Maroc@3", "la Tunisie@3", "la présidente finlandaise@3", "les actionnaires de Total@6", "la Suisse@3", "Nestlé@3", "les trois petits cochons@6", "les Quatre Fantastiques@6", "Dieu@3", "le Diable@3", "la Panthère Rose@3", "les frères Bogdanov@6"],
	verbes: {
		transitifs: ["être", "manger#10", "trouver#1", "chercher#1", "aimer#1", "laisser#1", "faire", "regarder#1", "vouloir", "casser#1", "prendre#13", "refuser#1", "déplacer#9", "acheter#12", "dissimuler#1", "préférer#11", "montrer#1", "utiliser#1", "détester#1", "surmonter#1", "modifier#1", "attirer#1", "construire#6", "abandonner#1", "éviter#1", "garder#1", "tenir#8", "sentir#3", "avoir", "démonter#1", "jeter", "partager#10", "découvrir#16", "découper#1", "admirer#1", "proposer#1", "vérifier#1", "réunir#2", "surestimer#1", "accuser#1", "accepter#1", "mériter#1", "voler#1", "imaginer#1", "renverser#1", "pousser#1", "tirer#1", "dénigrer#1", "pourchasser#1", "inventer#1", "oublier#1", "commander#1", "apporter#1", "supporter#1", "transporter#1", "porter#1", "suivre", "attaquer#1", "défendre#4", "entasser#1", "imiter#1", "finir#2", "bannir#2", "définir#2", "aplatir#2", "embellir#2", "durcir#2", "bénir#2", "retrouver#1", "gagner#1", "perdre", "interdire", "chasser#1", "conserver#1", "appeler", "regretter#1", "décorer#1", "ausculter#1", "repousser#1", "épouser#1", "inviter#1", "augmenter#1", "créer#1", "organiser#1", "voir", "laver#1", "analyser#1", "posséder#11", "vendre#4", "entendre#4", "rendre#4", "suspendre#4", "connaître#5", "reconnaître#5", "conduire#6", "cuire#6", "détruire#6", "craindre", "peindre#7", "atteindre#7", "éteindre#7", "étreindre#7", "restreindre#7", "retenir#8", "soutenir#8", "obtenir#8", "détenir#8", "devenir#8", "exécuter#1", "placer#9", "remplacer#9", "agacer#9", "défoncer#9", "offenser#1", "choisir#2", "exiger#10", "déranger#10", "ranger#10", "juger#10", "féliciter#1", "absorber#1", "opprimer#1", "limiter#1", "libérer#11", "mimer#1", "enfermer#1", "agiter#1", "respecter#1", "pondre#4", "toucher#1", "provoquer#1", "piquer#1", "viser#1", "évaluer#1", "récupérer#11", "percuter#1", "tabasser#1", "disséquer#11", "attraper#1", "rattraper#1", "diminuer#1", "enflammer#1", "vider#1", "bousculer#1", "trimbaler#1", "promener#12", "amener#12", "ramener#12", "emmener#12", "peser#12", "soupeser#12", "congeler#12", "décongeler#12", "bercer#9", "lever#12", "élever#12", "relever#12", "enlever#12", "soulever#12", "racheter#12", "manipuler#1", "balancer#9", "lancer#9", "relancer#9", "consommer#1", "produire#6", "séduire#6", "dessiner#1", "esquiver#1", "blâmer#1", "maîtriser#1", "dompter#1", "apprivoiser#1", "dévaliser#1", "tondre#4", "chatouiller#1", "lapider#1", "brûler#1", "user#1", "dévisser#1", "nourrir#2", "mesurer#1", "compter#1", "annoncer#9", "briser#1", "hypnotiser#1", "tester#1", "poser#1", "déposer#1", "dépasser#1", "entourer#1", "encercler#1", "envelopper#1", "comprendre#13", "reprendre#13", "compromettre#14", "omettre#14", "revendiquer#1", "mordre", "essuyer#15", "baptiser#1", "couvrir#16", "ouvrir#16", "fermer#1", "vanter#1", "réclamer#1", "demander#1", "recommander#1", "rechercher#1", "révéler#11", "rater#1", "secouer#1", "grignoter#1", "machouiller#1", "digérer#11", "désigner#1", "consulter#1", "étudier#1", "frapper#1", "goûter#1", "dérouiller#1", "cabosser#1", "pratiquer#1", "décortiquer#1", "sucrer#1", "saler#1", "installer#1", "tricoter#1", "limer#1", "battre#17", "combattre#17", "abattre#17", "importer#1", "exporter#1", "croquer#1", "scier#1", "labourer#1", "étendre#4", "attendre#4", "encadrer#1", "emballer#1", "ligoter#1", "lier#1", "détacher#1", "plier#1", "déplier#1", "replier#1", "conspuer#1", "£onnir#2", "£umer#1", "catapulter#1", "perforer#1", "allumer#1", "irriguer#1", "intérioriser#1", "inhaler#1", "vitrifier#1", "désavouer#1", "éplucher#1", "espérer#11", "réussir#2", "tenter#1", "préconiser#1", "négliger#10", "envisager#10", "cacher#1", "redouter#1", "alimenter#1", "allaiter#1", "accoster#1", "asservir#2", "arroser#1", "assaisonner#1", "annexer#1", "activer#1", "bâtir#2", "bloquer#1", "brancher#1", "brandir#2", "broder#1", "butiner#1", "cirer#1", "choper#1", "camoufler#1", "cambrioler#1", "charger#10", "décharger#10", "censurer#1", "capturer#1", "convoiter#1", "copier#1", "cultiver#1", "crucifier#1", "chevaucher#1", "équilibrer#1", "déséquilibrer#1", "compléter#11", "sélectionner#1", "filtrer#1", "fouetter#1", "vaporiser#1", "agripper#1", "approcher#1", "aspirer#1", "ventouser#1", "proscrire#18", "réfuter#1", "renforcer#9", "assommer#1", "annuler#1", "occulter#1", "subodorer#1", "pourfendre#4", "regonfler#1", "gonfler#1", "remplir#2", "planter#1", "déplorer#1", "adorer#1", "£aïr", "embarquer#1", "contourner#1", "détourner#1", "reporter#1", "emporter#1", "endommager#10", "réveiller#1", "flagorner#1", "employer#15", "atermoyer#15", "broyer#15", "choyer#15", "convoyer#15", "déployer#15", "foudroyer#15", "nettoyer#15", "tutoyer#15", "vouvoyer#15", "essayer#15", "payer#15", "se payer#15", "balayer#15", "effrayer#15", "égayer#15", "enrayer#15", "monnayer#15", "relayer#15", "amorcer#9", "désamorcer#9", "financer#9", "balafrer#1", "concurrencer#9", "dénoncer#9", "devancer#9", "distancer#9", "effacer#9", "enlacer#9", "dénaturer#1", "pulvériser#1", "influencer#9", "menacer#9", "replacer#9", "rincer#9", "tracer#9", "traquer#1", "percer#9", "transpercer#9", "coltiner#1", "raper#1", "opérer#11", "entretenir#8", "escamoter#1", "chiffrer#1", "clarifier#1", "éclaircir#2", "égratigner#1", "érafler#1", "frôler#1"],
		intransitifs: ["chanter#1", "parler#1", "rire", "dormir", "attendre#4", "jouer#1", "crier#1", "lire", "transpirer#1", "souffrir#16", "guérir#2", "réfléchir#2", "courir", "travailler#1", "jongler#1", "tousser#1", "vieillir#2", "parader#1", "abandonner#1", "recommencer#9", "marcher#1", "pique-niquer#1", "sautiller#1", "craquer#1", "venir#8", "traîner#1", "discuter#1", "frimer#1", "trembler#1", "hésiter#1", "revenir#8", "comploter#1", "cuisiner#1", "skier#1", "soupirer#1", "vivre", "fumer#1", "gesticuler#1", "arriver#1", "partir#3", "gémir#2", "frémir#2", "£ennir#2", "pourrir#2", "rêver#1", "triompher#1", "échouer#1", "tomber#1", "trébucher#1", "voyager#10", "fleurir#2", "atterrir#2", "languir#2", "agoniser#1", "méditer#1", "changer#10", "disparaître#5", "apparaître#5", "geindre#7", "peindre#7", "intervenir#8", "repartir#3", "avancer#9", "bouger#10", "rougir#2", "bronzer#1", "errer#1", "agir#2", "mentir#3", "stagner#1", "progresser#1", "régresser#1", "reculer#1", "prier#1", "céder#11", "dériver#1", "grandir#2", "rajeunir#2", "délirer#1", "éternuer#1", "grossir#2", "maigrir#2", "cracher#1", "vibrer#1", "digérer#11", "délibérer#11", "récidiver#1", "pleurer#1", "grogner#1", "tituber#1", "briller#1", "passer#1", "ruminer#1", "gazouiller#1", "bafouiller#1", "flâner#1", "patiner#1", "zigzaguer#1", "rétrécir#2", "filer#1", "fondre#4", "mourir", "étouffer#1", "respirer#1", "ruser#1", "souffler#1", "fuir", "ramper#1", "se cacher#1", "s'allonger#10", "se laver#1", "se coiffer#1", "se reposer#1", "se nourrir#2", "se calmer#1", "s'énerver#1", "se tromper#1", "s'essouffler#1", "s'amuser#1", "se divertir#2", "s'auto-mutiler#1", "se suicider#1", "s'exprimer#1", "se détendre#4", "se montrer#1", "se méfier#1", "se lever#12", "se coucher#1", "se moucher#1", "s'échapper#1", "se débrouiller#1", "s'ennuyer#15", "se relever#12", "se racheter#12", "se soulever#12", "se rattraper#1", "s'agiter#1", "se marrer#1", "frissonner#1", "s'inquiéter#11", "persévérer#11", "se morfondre#4", "râler#1", "protester#1", "se prosterner#1", "se baigner#1", "jubiler#1", "bosser#1", "trembloter#1", "chigner#1", "couiner#1", "baffrer#1", "déconner#1", "glander#1", "poireauter#1", "gonfler#1", "enfler#1", "se dégonfler#1", "parlementer#1", "abdiquer#1", "accélérer#11", "alunir#2", "barboter#1", "batifoler#1", "baver#1", "bavarder#1", "beugler#1", "bifurquer#1", "bivouaquer#1", "blasphémer#11", "blémir#2", "bouder#1", "bouquiner#1", "bourlinguer#1", "boursicoter#1", "bricoler#1", "chahuter#1", "chipoter#1", "chômer#1", "cicatriser#1", "circuler#1", "double-cliquer#1", "cogiter#1", "exister#1", "culpabiliser#1", "cotiser#1", "coopérer#11", "décompresser#1", "décliner#1", "conspirer#1", "déjeuner#1", "démissionner#1", "dépérir#2", "déprimer#1", "déraper#1", "divaguer#1", "empester#1", "puer#1", "exulter#1", "faiblir#2", "fanfaronner#1", "fantasmer#1", "gamberger#10", "frétiller#1", "fulminer#1", "gargouiller#1", "gigoter#1", "glisser#1", "glousser#1", "hiberner#1", "£ululer#1", "£urler#1", "imploser#1", "insister#1", "jardiner#1", "jaunir#2", "jeûner#1", "macérer#11", "manoeuvrer#1", "militer#1", "mincir#2", "moisir#2", "morfler#1", "muer#1", "mugir#2", "murmurer#1", "nager#10", "osciller#1", "pâlir#2", "papoter#1", "patienter#1", "pavoiser#1", "pester#1", "picoler#1", "pinailler#1", "pivoter#1", "polémiquer#1", "postillonner#1", "proliférer#11", "radoter#1", "ralentir#2", "ramer#1", "bondir#2", "rebondir#2", "remuer#1", "resplendir#2", "ressusciter#1", "resurgir#2", "ricaner#1", "rigoler#1", "riposter#1", "rôder#1", "ronfler#1", "ronronner#1", "roucouler#1", "roupiller#1", "saliver#1", "sangloter#1", "siffler#1", "somnoler#1", "spéculer#1", "s'installer#1", "suffoquer#1", "sursauter#1", "temporiser#1", "trépigner#1", "tricher#1", "tricoter#1", "trimer#1", "valser#1", "végéter#11", "se réveiller#1", "vociférer#11", "rugir#2", "maugréer#1", "saigner#1", "réussir#2", "douter#1", "accoucher#1", "s'alimenter#1", "balbutier#1", "évoluer#1", "verdir#2", "léviter#1", "s'accrocher#1", "se rapprocher#1", "écrire#18", "se désaltérer#11", "mener#12", "diminuer#1", "se tortiller#1", "se planter#1", "tourner#1", "s'inscrire#18", "clignoter#1", "se désinscrire#18", "tournoyer#15", "se noyer#15", "guerroyer#15", "aboyer#15", "festoyer#15", "flamboyer#15", "se fourvoyer#15", "bégayer#15", "embrayer#15", "débrayer#15", "pagayer#15", "divorcer#9", "grimacer#9", "s'étendre#4", "se goinfrer#1", "s'empiffrer#1", "s'étioler#1", "sombrer#1"],
		modaux: {
			simples: ["préférer#11", "aimer#1", "vouloir", "détester#1", "désirer#1", "devoir", "croire", "pouvoir", "savoir", "nier#1", "sembler#1", "oser#1", "dire", "prétendre#4", "admettre#14", "adorer#1", "affirmer#1", "avouer#1", "compter#1", "daigner#1", "déclarer#1", "paraître#5", "reconnaître#5", "retourner#1", "revenir#8", "souhaiter#1", "aller"],
			suivisDeDE: ["refuser#1", "attendre#4", "éviter#1", "accepter#1", "mériter#1", "imaginer#1", "supporter#1", "oublier#1", "finir#2", "regretter#1", "parler#1", "rêver#1", "projeter", "arrêter#1", "essayer#15", "tenter#1", "cesser#1", "feindre#7", "ambitionner#1", "proposer#1", "craindre", "décider#1", "choisir#2", "exiger#10", "envisager#10", "risquer#1", "permettre#14", "redouter#1", "jurer#1", "omettre#14", "s'interdire", "se dispenser#1", "promettre#14", "se promettre#14", "se permettre#14", "se proposer#1", "s'arrêter#1", "s'accuser#1", "se passer#1", "se retenir#8", "se garder#1", "souffrir#16", "se vanter#1", "réclamer#1", "négliger#10", "préconiser#1", "menacer#9", "se dépêcher#1", "se grouiller#1", "se £âter#1", "s'empêcher#1"],
			suivisDeA: ["hésiter#1", "penser#1", "tenir#8", "jouer#1", "veiller#1", "commencer#9", "réussir#2", "échouer#1", "tendre#4", "continuer#1", "aspirer#1", "parvenir#8", "consentir#3", "arriver#1", "songer#10", "chercher#1", "peiner#1", "oeuvrer#1", "participer#1", "contribuer#1", "persister#1", "viser#1", "apprendre#13", "se décider#1", "se limiter#1", "s'attendre#4", "se refuser#1", "se résoudre", "s'ennuyer#15", "se remettre#14", "se borner#1", "s'obstiner#1", "s'acharner#1", "se mettre#14", "rechercher#1", "renâcler#1", "se préparer#1", "s'entrainer#1", "s'amuser#1", "tarder#1", "s'habituer#1", "s'appliquer#1", "s'exercer#9", "se forcer#9", "travailler#1", "s'essayer#15"]
		},
		avecPreposition: {
			codCoi: ["donner#1", "expliquer#1", "prendre#13", "voler#1", "conseiller#1", "déconseiller#1", "imposer#1", "lire", "attacher#1", "associer#1", "prêter#1", "apporter#1", "suspendre#4", "reprendre#13", "réclamer#1", "demander#1", "mendier#1", "apprendre#13", "envoyer", "transmettre#14", "promettre#14", "remettre#14", "laisser#1", "faire", "refuser#1", "acheter#12", "racheter#12", "montrer#1", "abandonner#1", "jeter", "proposer#1", "commander#1", "interdire", "vendre#4", "rendre#4", "mimer#1", "ramener#12", "amener#12", "lancer#9", "dessiner#1", "annoncer#9", "coller#1", "accrocher#1", "assimiler#1", "greffer#1", "offrir#16", "dédicacer#9", "signaler#1", "suggérer#11", "destiner#1", "soutirer#1", "vouer#1", "restituer#1", "passer#1", "présenter#1", "accorder#1", "fournir#2", "opposer#1", "indiquer#1", "confier#1", "confisquer#1", "faxer#1", "inspirer#1", "décrire#18", "transcrire#18", "revendre#4", "recommander#1", "octroyer#15", "inoculer#1"],
			a: ["résister#1", "penser#1", "songer#10", "ressembler#1", "coller#1", "trinquer#1", "répondre#4", "réagir#2", "nuire", "contribuer#1", "correspondre#4", "accéder#11", "succéder#11", "téléphoner#1", "échapper#1", "s'attacher#1", "se vouer#1", "se référer#11", "se limiter#1", "s'opposer#1", "s'associer#1", "se consacrer#1", "s'appuyer#15", "se mesurer#1", "s'attaquer#1", "recourir", "souscrire#18", "s'attendre#4", "s'abonner#1"],
			de: ["se souvenir#8", "se méfier#1", "parler#1", "rêver#1", "se passer#1", "se priver#1", "se gaver#1", "hériter#1", "se moquer#1", "se débarrasser#1", "se munir#2", "s'armer#1", "s'équiper#1", "disposer#1", "profiter#1", "approcher#1", "se rapprocher#1", "provenir#8", "débattre#17", "douter#1", "s'enorgueillir#2", "accoucher#1", "s'approcher#1", "s'inspirer#1", "dépendre#4", "se détourner#1"],
			sur: ["compter#1", "miser#1", "tabler#1", "reposer#1", "se reposer#1", "se ruer#1", "atterrir#2", "se baser#1", "grimper#1", "se tenir#8", "s'appuyer#1", "régner#11", "s'interroger#10", "se rabattre#17", "cogner#1", "taper#1", "empiéter#11", "s'extasier#1", "glisser#1", "influer#1", "insister#1", "se lamenter#1", "lésiner#1", "méditer#1", "se calquer#1", "se poster#1", "se précipiter#1", "se jeter", "se venger#10", "se défouler#1", "s'acharner#1", "travailler#1", "monter#1", "tomber#1", "trébucher#1", "bloquer#1", "rebondir#2", "buter#1", "pisser#1", "vomir#2", "s'étendre#4"],
			avec2obj: ["comparer#1", "confondre#4", "mélanger#10", "associer#1", "combiner#1", "frotter#1", "gratter#1", "casser#1", "utiliser#1", "défendre#4", "aplatir#2", "pourchasser#1", "ausculter#1", "envelopper#1", "décorer#1", "masquer#1", "aligner#1", "filtrer#1", "marier#1", "frapper#1", "fouetter#1", "nettoyer#15", "transpercer#9", "raper#1", "tresser#1", "nouer#1", "lier#1"],
			et2obj: ["comparer#1", "confondre#4", "mélanger#10", "associer#1", "réunir#2", "unir#2", "confronter#1", "séparer#1", "distinguer#1", "différencier#1", "opposer#1", "dissocier#1", "conjuguer#1", "rapprocher#1", "rassembler#1", "additionner#1", "agglomérer#11"],
			lieu: ["repartir#3", "aller", "revenir#8", "atterrir#2", "tomber#1", "arriver#1", "partir#3", "venir#8", "fuir", "être", "rester#1", "vivre", "habiter#1", "loger#10", "résider#1", "demeurer#1", "dormir", "travailler#1", "intervenir#8", "apparaître#5", "filer#1", "monter#1", "descendre#4", "retourner#1", "se tenir#8", "se rendre#4", "se cacher#1", "se situer#1", "se réfugier#1", "s'enfuir", "se retrouver#1", "se trouver#1", "se poser#1", "se placer#9", "se pointer#1", "se trimbaler#1", "se transporter#1", "se perdre", "sortir#3", "entrer#1", "passer#1", "stagner#1", "poireauter#1", "défiler#1", "squatter#1", "camper#1", "déferler#1", "croupir#2", "dégringoler#1", "déguerpir#2", "émigrer#1", "emménager#10", "farfouiller#1", "foncer#9", "s'incruster#1", "fouiner#1", "glisser#1", "moisir#2", "nager#10", "naviguer#1", "dériver#1", "s'exiler#1", "patauger#10", "patrouiller#1", "plonger#10", "se précipiter#1", "se ruer#1", "rappliquer#1", "surgir#2", "resurgir#2", "séjourner#1", "stationner#1", "se garer#1", "s'installer#1", "débouler#1", "se tailler#1", "se barrer#1", "galoper#1", "se terrer#1", "se faufiler#1", "s'agglutiner#1", "se planter#1", "débarquer#1", "se gauffrer#1", "se vautrer#1", "se téléporter#1", "sombrer#1"]
		}
	},
	complements: {
		objDir: ["le néant", "la vérité", "les fleurs sauvages", "un gâteau au chocolat", "plusieurs véhicules", "quelque chose", "le poulet rôti", "n'importe quoi", "tes chaussures", "l'objet du désir", "ce que tu veux", "trente euros", "la porte du garage", "tout un tas de trucs", "la même chose", "ce téléphone", "la liberté", "la vie", "un dictionnaire", "la mort", "les vacances", "un malentendu", "les membres du conseil d'administration", "le chien du voisin", "votre médecin traitant", "cette colonie de termites", "les plus hauts nuages", "les outils nécessaires", "dix kilos de trombones", "des choses innommables", "ce qu'il y a de plus absurde", "la démocratie", "un tracteur", "tes genoux", "le facteur", "cet ordinateur", "la table du salon", "cette canette de bière", "un séquoia de quarante mètres", "la camionnette de mon beau-frère", "une mèche de cheveux", "une caisse d'explosifs", "des comptes bancaires en Suisse", "la bronchite chronique", "un tube de smarties", "le premier prix de beauté", "un lance-roquettes", "l'épave du Clémenceau", "une bouteille de Château Latour 1976", "des objets métalliques", "l'aspirateur", "une sculpture moderne", "ta récompense", "le sol", "le ciel", "la lune", "les rayons du soleil", "l'océan", "une rivière", "les sandales du prophète", "des armes bactériologiques", "le mistral", "quelques cigarettes", "un lance-pierre de compétition", "ce laboratoire", "le courage de continuer", "le feu de la passion", "une allumette", "la solitude", "les tartes à la rhubarbe", "une idée de génie", "tout ce qu'il faut", "ce dont je t'ai parlé", "autre chose", "une nouvelle méthode", "la victoire", "les allemands", "un parisien", "une arme à feu", "le mur", "une chaise", "mon bras", "ton coeur", "notre courage", "cette longue amitié", "le regard d'un criminel", "un château", "des centaines de ragondins", "la collection complète des oeuvres de Saint-Simon", "une porte", "le générateur de phrases", "FireFox", "du code Javascript", "un feu", "de l'eau", "le contraire", "un acte héroïque", "la violence", "la science", "soixante mille tonnes de poisson congolais", "l'étincelle de la vie", "mon meilleur fromage", "ta chaussure gauche", "treize euros cinquante", "l'absence de tout scrupule", "chaque objet de valeur", "une excellente surprise", "la barbarie moderne", "trois pesos", "un baril de pétrole", "le gouvernement cubain", "les amis de ta femme", "Hiroshima", "Paris", "la banlieue de Pont-à-Mousson", "le verbe \"aimer\"", "quelque chose d'intangible", "l'obstacle", "la vengeance", "tout", "le grand toboggan", "un mystérieux visiteur", "le mot \"gnouffesque\"", "le record du monde du six cent mètres", "un objet complètement inutile", "la raison du plus fort", "le plafond de la Chapelle Sixtine", "la moquette", "le PIB du Guatemala", "le Parlement européen", "ce sentiment", "tes vaines promesses", "mes illusions de jeunesse", "toutes mes excuses", "un mécanisme trop complexe", "l'irrésistible appel du large", "une souris", "un cloporte", "la rancune", "de la neige", "du sable", "de belles idées", "les mêmes conneries", "un drôle de truc", "un ordinateur portable", "le mot de la fin", "la mélancolie", "cette chanson", "la suite", "un verre de vodka", "ta main", "mes yeux", "un corps d'athlète", "le courrier en retard", "un colis piégé", "un piège grossier", "de l'énergie", "autrui", "ça", "l'adultère", "la suite des événements", "le monde", "tout le monde", "deux cents grammes de mimolette en tranches", "le complément d'objet de cette phrase", "la plus grande choucroute du monde", "du pudding", "une valise de drogue", "les dossiers du Canard Enchainé", "toute l'humanité", "la société des hommes", "la Déclaration Universelle des Droits de l'Homme", "la Bible", "le Coran", "la Torah"],
		temps: ["il y a très longtemps€1", "avant ta venue au monde€1", "hier€1", "l'année dernière€1", "quand je serai grand€3", "dans &0 jours€3", "demain€3", "dans & secondes exactement€3", "dans &0 minutes€3", "à cet instant précis€2", "aujourd'hui", "quand la chine s'éveillera€3", "au moyen-âge€1", "jusqu'à aujourd'hui€1", "dorénavant€3", "dans &00 ans€3", "le jour du jugement dernier€3", "jeudi dernier€1", "avant mai 68€1", "depuis toujours€2", "depuis les dernières élections€2", "quand tu voudras€3", "lorsque tout aura disparu€3", "avant toute cette affaire€1", "à mon signal€3", "jusqu'à nouvel ordre€3", "au temps des pharaons€1", "la veille de Noël", "depuis ton accident€2", "à chaque révolution€2", "chaque jour€2", "chaque année€2", "après votre retour€3", "maintenant€2", "quand ce sera possible€3", "quand j'en aurai vraiment marre€3", "avant la catastrophe€1", "au même moment", "à tout jamais€3", "dans & ans€3", "l'année prochaine€3", "hier midi€1", "quand les poules auront des dents€3", "quand tout aura cramé€3", "au début€1", "juste avant que le jour ne se lève€3", "pendant le mois de Ramadan", "pendant les vacances scolaires", "pendant la nuit", "avant-hier€1", "après-demain€3", "pendant tout l'été", "au début du printemps", "à l'automne", "en hiver", "à midi", "à minuit", "vers deux heures du matin€3", "en plein après-midi", "tous les matins", "tous les jours", "toutes les nuits", "tous les ans", "tous les mercredis", "tous les mois", "& fois par an", "& fois par semaine", "& fois par jour", "une fois tous les & ans environ", "tous les dimanches", "après le solstice d'été€3", "à partir de demain€3", "le jour J€3", "avant $€1", "aux funérailles de $€2", "quand tout le monde aura oublié $€3", "le jour où $ et $ se rencontreront€3", "le jour de la naissance de $€1", "à une époque où $ mouillait encore ses couches€1", "dès que $ aura donné son accord€3", "avant la mort de $€1", "à & heures précises", "le jour de l'anniversaire des & ans de $€2", "au quatrième \"top\"€3", "& jours après Noël", "& mois avant l'élection de $ aux plus hautes fonctions de l'Etat", "& ans avant l'invention de la mobylette par $", "& minutes avant de monter sur scène", "après le grand cataclysme€3", "après les soldes€3", "& semaines après l'accident", "après les élections de 2012€3", "à chaque anniversaire de la mort de $", "pendant plusieurs semaines", "pendant & minutes", "pendant plus de & ans", "au moment où $ l'aura décidé€3", "au moment voulu", "le jour où on appréciera $ à sa juste valeur€3", "en 1984€1", "en l'an de grâce 1248€1", "en l'an 2000€1", "en 1976€1", "en 1914€1", "en &0 avant Jésus-Christ€1", "& mille ans avant notre ère€1", "durant la dernière ère glaciaire€1", "en 1995€1", "en 2050€3", "en l'an 3000€3", "lors de l'éruption du Krakatoa€1", "le 14 juillet 1789€1"],
		lieu: ["à la maison", "dans mon jardin", "en voiture", "chez Mamie", "sur le quai de la gare", "dans la rue", "là-bas", "ailleurs", "aux confins de la galaxie", "à Nancy", "partout", "en Allemagne", "sur une aire d'autoroute", "chez toi", "tout le long du chemin", "à l'arrivée", "sous tes yeux", "à portée de main", "sur la plage", "au bar du coin", "dans le sud de l'Italie", "à Barcelone", "au bout du parcours", "dans la forêt", "dans une cabine téléphonique", "sur la place du marché", "où tu veux", "sur mon canapé", "à la piscine", "dans une banque du Luxembourg", "à bord d'une péniche", "ici", "chez moi", "chez le coiffeur", "au fond des égouts", "par terre", "en l'air", "tout là-bas", "à l'intérieur", "dehors", "au sous-sol", "à Londres", "dans un bunker", "sur un terrain de golf", "dans les banques", "sous les arbres", "derrière la maison", "dans l'escalier", "dans l'ascenseur", "en terrain conquis", "à domicile", "au dernier sous-sol du parking souterrain", "à l'aéroport", "au guichet de la poste", "dans un avion", "à la morgue", "en face du cimetière", "dans les couloirs de l'hôpital", "en montagne", "au bord de la mer", "au lit", "tout là-haut", "très loin d'ici", "à proximité", "à la croisée des chemins", "en plein air", "au calme", "sur le ring", "sous les projecteurs", "en coulisses", "dans mon bureau", "sous terre", "à &0 mètres d'ici", "à environ & kilomètres", "à & années-lumière du soleil", "à plus de &00 kilomètres de la civilisation", "au pôle nord", "en Antarctique", "à la limite du cercle polaire arctique", "en Birmanie", "au Soudan", "à Mexico", "aux abords du Yang Tse Kiang", "sur les pentes enneigées de l'Everest", "sous le soleil de Caracas", "en ville", "au centre-ville", "à la campagne", "chez nous", "chez vous", "chez eux", "dans le désert", "sur le flanc du Vésuve", "sur le parking du supermarché", "sur le trottoir d'en face", "sur un terrain d'aviation", "au Népal", "en Palestine", "au Chili", "en Mauritanie", "en Inde", "en Pologne", "en France", "en Europe", "en Russie", "en Belgique", "en Suisse", "sous les mers", "sur la Lune", "en Espagne", "en Irlande", "à l'ombre", "au soleil", "sur le toit de l'église", "sur Terre", "au paradis", "en enfer", "au cimetière", "dans la cour de récréation", "dans un photomaton", "à Orléans", "à Rome", "à Stockholm", "sur un iceberg", "en public", "au secrétariat du premier étage", "en salle des professeurs", "au pays des merveilles", "à Disneyland", "sous les ponts", "sur le pont du Titanic", "dans les couloirs du pentagone", "dans le couloir de la mort", "sur l'aile d'un airbus en feu", "sur les rives du Nil", "à Tombouctou", "aux toilettes", "au restaurant", "à la frontière", "dans le jardin privé de $", "chez $", "près de $", "entre $ et $", "devant le lycée professionnel $", "au coin de l'avenue $ et du boulevard $", "dans l'impasse $", "au pays de $", "sur la terre qui a vu naître $", "aux pieds de $", "devant la statue de $", "sous les pavés", "à Moscou", "au pied de la statue de la liberté", "à bord d'un croiseur de classe IV", "bien à l'abri", "à l'ouest", "sous ton nez", "à & kilomètres vers le nord", "chez un +H", "chez une +F", "sous les yeux d'un +H", "sous les yeux d'une +F", "entre un +H et une +F", "à bord du wagon restaurant", "dans une autre dimension", "dans la quatrième dimension", "en Alaska", "au Guatemala", "en Iran", "en Afghanistan", "au Pérou", "en Chine", "dans le Poitou", "en Aquitaine", "en Slovaquie", "en Moldavie", "à Kyoto", "sur l'île de Sumatra", "aux alentours de Mexico", "à Copenhague", "à Varsovie", "en Grèce", "au large des Philippines", "à Bornéo", "à Calcutta", "au Japon", "au Brésil", "aux Etats-Unis", "à Atlanta", "à Manhattan", "dans le Massachussets", "dans l'Arkansas", "dans le Missouri", "en Floride", "dans les Vosges", "sur une île appartenant à $", "dans le lit d'un +H", "dans la chambre d'une +F", "là où $ a rencontré son premier +H", "là où chaque +F pense pouvoir rencontrer $", "sur le lieu de travail d'un +H", "sur le lieu de travail d'une +F", "dans & pays en même temps", "à Gotham City", "dans la gueule du loup", "dans le mur", "devant un +H", "devant une +F", "à la cantine", "au milieu de la fête foraine", "dans le tram", "à l'arrêt du tram", "dans une rue piétonnne", "sur la bande d'arrêt d'urgence", "dans le coffre de la voiture d'un +H", "dans les soutes du jet privé de $", "loin de tout +H", "loin de toute +F", "hors de l'emprise de $", "au Kenya", "en Irak", "au Portugal", "en Finlande", "sur les berges de la Loire", "au bord de la Seine", "aux fins fonds de la Meuse", "sur les rives du Rhin", "au musée de la bière", "dans les bureaux de la permanence syndicale", "tout le long de la frontière est du Turkmenistan", "à Dubai", "au Qatar", "dans le Calvados", "en Bourgogne", "en Ile-De-France", "au Québec", "à Montréal", "au fond du poulailler", "à Guantanamo", "quelque part autour de Kaboul", "en orbite géostationnaire", "en direction de $", "sur la tombe de $", "sur le pont de la rivière Kwaï", "au sud de Fort Alamo", "au Groland", "sur Internet", "en salle informatique", "en canoe kayak", "derrière vous", "derrière la porte interdite", "derrière les barricades", "bien au chaud", "dans la fosse commune"]
	},
	adverbes: {
		postpose: ["bien", "un petit peu", "calmement", "involontairement", "volontairement", "à peine", "vraiment", "nonchalamment", "logiquement", "irrationnellement", "normalement", "anormalement", "étrangement", "attentivement", "machinalement", "toujours", "encore", "souvent", "rarement", "follement", "longtemps", "clairement", "à moitié", "en partie", "facilement", "joyeusement", "tout bêtement", "discrètement", "assez bien", "à peu près", "pleinement", "patiemment", "délicatement", "courageusement", "joliment", "carrément", "violemment", "sérieusement", "intelligemment", "brillamment", "désespérément", "tristement", "définitivement", "curieusement", "divinement", "silencieusement", "bruyamment", "innocemment", "habilement", "rapidement", "délibérément", "trop", "beaucoup trop", "directement", "indirectement", "énergiquement", "totalement", "mal", "assez mal", "particulièrement mal", "très bien", "parfaitement", "tout doucement", "progressivement", "très légèrement", "insidieusement", "exagérément", "aléatoirement", "aveuglément", "complètement", "furieusement", "grossièrement", "mollement", "très mal", "incidemment", "irrespectueusement", "passionément", "modérément", "moyennement", "faussement", "en force", "en douce"],
		fin: ["sans hésitation", "à toute vitesse", "avec ferveur", "sans le vouloir", "avec style", "comme d'habitude", "à moitié", "en partie", "avec élégance", "à contre-coeur", "à l'envers", "& fois de suite", "une dizaine de fois", "sans pudeur", "sans scrupules", "sans en avoir l'air", "sans en avoir les moyens", "avec fougue", "avec beaucoup de rigueur", "à l'arrache", "sur commande", "avec application", "sans y penser", "à l'infini", "avec amour", "avec difficulté", "sans le faire exprès", "par inadvertance", "avec conviction", "jusqu'à ce que mort s'ensuive", "à toute berzingue", "sans en avertir $", "à la manière de $", "grâce à $", "par la faute de $", "en collaboration avec $ et $", "sur les conseils d'un +H", "sur les conseils d'une +F", "comme le suggérait $", "avec ou sans l'accord de $", "avec l'aide de $", "malgré les reproches de $", "comme $", "jusqu'à plus soif", "jusqu'au bout", "avec brio", "incognito", "en catimini", "avec l'aide de & personnes", "& fois par jour", "en & phases bien précises", "sans aucun respect pour $", "n'importe comment", "jusqu'à la nausée", "à corps et à cris", "comme si de rien n'était", "grâce à un +H", "grâce à une +F", "en compagnie d'un +H", "en compagnie d'une +F", "pour nuire aux intérêts de $", "pour s'attirer les faveurs de $", "sur les ordres de $", "en apesanteur", "sans la moindre honte"]
	},
	ponctuation: {
		virgule: [","],
		deuxPoints: [":"],
		pointVirgule: [";"],
		pointFinal: [".", " !", "..."]
	},
	negations: ["pas", "plus", "pas encore", "presque plus", "point", "guère", "jamais", "presque jamais", "plus jamais", "pas du tout", "pas vraiment"],
	PROBA_NEGATIONS: [12, 3, 2, 1, 1, 1, 2, 1, 1, 1, 1],
	pronomsReflexifs: ["me", "te", "se", "nous", "vous", "se"],

	// --- METHODES "PUBLIQUES" ---
	recupererMot: function (code) {
		if ((code == "CT") && (de(6) > 5))
			return ((de(3) > 1) ? Generateur.date() : Generateur.annee());
		var liste = Grimoire.recupererListe(code);
		return liste[de(liste.length) - 1];
	},
	recupererListe: function (code) {
		switch (code) {
			case "ST":
				return Grimoire.listerStructures();
			case "GN":
				return Grimoire.sujets;
			case "VT":
			case "PR_T":
				return Grimoire.verbes.transitifs;
			case "VN":
			case "PR_N":
				return Grimoire.verbes.intransitifs;
			case "VM":
				return Grimoire.verbes.modaux.simples;
			case "VD":
				return Grimoire.verbes.modaux.suivisDeDE;
			case "VA":
				return Grimoire.verbes.modaux.suivisDeA;
			case "VOA":
				return Grimoire.verbes.avecPreposition.a;
			case "VOD":
				return Grimoire.verbes.avecPreposition.de;
			case "VOI":
				return Grimoire.verbes.avecPreposition.codCoi;
			case "VTL":
				return Grimoire.verbes.avecPreposition.lieu;
			case "VAV":
				return Grimoire.verbes.avecPreposition.avec2obj;
			case "VET":
				return Grimoire.verbes.avecPreposition.et2obj;
			case "VOS":
				return Grimoire.verbes.avecPreposition.sur;
			case "CO":
				return Grimoire.complements.objDir;
			case "CL":
				return Grimoire.complements.lieu;
			case "CT":
				return Grimoire.complements.temps;
			case "AP":
				return Grimoire.adverbes.postpose;
			case "AF":
				return Grimoire.adverbes.fin;
			case "VG":
				return Grimoire.ponctuation.virgule;
			case "2P":
				return Grimoire.ponctuation.deuxPoints;
			case "PV":
				return Grimoire.ponctuation.pointVirgule;
			case "PF":
				return Grimoire.ponctuation.pointFinal;
			case "NG":
				return Grimoire.negations;
		}
	},

	conjuguer: function (verbe, temps, pers) {
		var formes = [];
		var prefixe = "";
		var pronominal = (/^s(\'|e )/).test(verbe);
		if (pronominal) {
			verbe = verbe.replace(/^s(\'|e )(.*)/, "$2");
		}

		var personne = pers;

		var persParticipe = 0;
		if (type(personne) == "array") {
			persParticipe = personne[1];
			personne = personne[0];
		}

		var posGroupe = verbe.indexOf("#");
		if (posGroupe > -1) { // groupes réguliers
			var groupe = parseInt(verbe.substr(posGroupe + 1), 10);
			var racine, terminaisons, inter = "";
			switch (groupe) {
				case 1:// verbes #1 : (modèle: chanter)
					racine = verbe.substr(0, verbe.lastIndexOf("er"));
					terminaisons = [
						["ais", "ais", "ait", "ions", "iez", "aient"],
						["e", "es", "e", "ons", "ez", "ent"],
						["erai", "eras", "era", "erons", "erez", "eront"],
						["é", "ant"]
					];
					break;
				case 2:// verbes #2 : (modèle: finir)
					racine = verbe.substr(0, verbe.lastIndexOf("ir"));
					terminaisons = [
						["issais", "issais", "issait", "issions", "issiez", "issaient"],
						["is", "is", "it", "issons", "issez", "issent"],
						["irai", "iras", "ira", "irons", "irez", "iront"],
						["i", "issant"]
					];
					break;
				case 3:// verbes #3 : (modèle: sentir)
					racine = verbe.substr(0, verbe.lastIndexOf("tir"));
					terminaisons = [
						["tais", "tais", "tait", "tions", "tiez", "taient"],
						["s", "s", "t", "tons", "tez", "tent"],
						["tirai", "tiras", "tira", "tirons", "tirez", "tiront"],
						["ti", "tant"]
					];
					break;
				case 4:// verbes #4 : (modèle: vendre/répondre)
					racine = verbe.substr(0, verbe.lastIndexOf("re"));
					terminaisons = [
						["ais", "ais", "ait", "ions", "iez", "aient"],
						["s", "s", "", "ons", "ez", "ent"],
						["rai", "ras", "ra", "rons", "rez", "ront"],
						["u", "ant"]
					];
					break;
				case 5:// verbes #5 : (modèle: paraître)
					racine = verbe.substr(0, verbe.lastIndexOf("aître"));
					terminaisons = [
						["aissais", "aissais", "aissait", "aissions", "aissiez", "aissaient"],
						["ais", "ais", "aît", "aissons", "aissez", "aissent"],
						["aîtrai", "aîtras", "aîtra", "aîtrons", "aîtrez", "aîtront"],
						["u", "aissant"]
					];
					break;
				case 6:// verbes #6 : (modèle: construire)
					racine = verbe.substr(0, verbe.lastIndexOf("re"));
					terminaisons = [
						["sais", "sais", "sait", "sions", "siez", "saient"],
						["s", "s", "t", "sons", "sez", "sent"],
						["rai", "ras", "ra", "rons", "rez", "ront"],
						["t", "sant"]
					];
					break;
				case 7:// verbes #7 : (modèle: peindre)
					racine = verbe.substr(0, verbe.lastIndexOf("eindre"));
					terminaisons = [
						["eignais", "eignais", "eignait", "eignions", "eigniez", "eignaient"],
						["eins", "eins", "eint", "eignons", "eignez", "eignent"],
						["eindrai", "eindras", "eindra", "eindrons", "eindrez", "eindront"],
						["eint", "eignant"]
					];
					break;
				case 8:// verbes #8 : (modèle: tenir)
					racine = verbe.substr(0, verbe.lastIndexOf("enir"));
					terminaisons = [
						["enais", "enais", "enait", "enions", "eniez", "enaient"],
						["iens", "iens", "ient", "enons", "enez", "iennent"],
						["iendrai", "iendras", "iendra", "iendrons", "iendrez", "iendront"],
						["enu", "enant"]
					];
					break;
				case 9:// verbes #9 : (modèle: placer)
					racine = verbe.substr(0, verbe.lastIndexOf("cer"));
					terminaisons = [
						["çais", "çais", "çait", "cions", "ciez", "çaient"],
						["ce", "ces", "ce", "çons", "cez", "cent"],
						["cerai", "ceras", "cera", "cerons", "cerez", "ceront"],
						["cé", "çant"]
					];
					break;
				case 10:// verbes #10 : (modèle: manger)
					racine = verbe.substr(0, verbe.lastIndexOf("er"));
					terminaisons = [
						["eais", "eais", "eait", "ions", "iez", "eaient"],
						["e", "es", "e", "eons", "ez", "ent"],
						["erai", "eras", "era", "erons", "erez", "eront"],
						["é", "eant"]
					];
					break;
				case 11:// verbes #11 : (modèle: récupérer/accéder)
					var posEaigu = verbe.lastIndexOf("é");
					racine = verbe.substr(0, posEaigu);
					inter = verbe.replace(/^(.*)é([^é]*)er#11$/, "$2");
					terminaisons = [
						["é_ais", "é_ais", "é_ait", "é_ions", "é_iez", "é_aient"],
						["è_e", "è_es", "è_e", "é_ons", "é_ez", "è_ent"],
						["é_erai", "é_eras", "é_era", "é_erons", "é_erez", "é_eront"],
						["é_é", "é_ant"]
					];
					break;
				case 12:// verbes #12 : (modèle: mener/lever/peser)
					var posEfaible = verbe.lastIndexOf("e");
					posEfaible = verbe.substr(0, posEfaible).lastIndexOf("e");
					racine = verbe.substr(0, posEfaible);
					inter = verbe.replace(/^(.*)e([^e]*)er#12$/, "$2");
					terminaisons = [
						["e_ais", "e_ais", "e_ait", "e_ions", "e_iez", "e_aient"],
						["è_e", "è_es", "è_e", "e_ons", "e_ez", "è_ent"],
						["è_erai", "è_eras", "è_era", "è_erons", "è_erez", "è_eront"],
						["e_é", "e_ant"]
					];
					break;
				case 13:// verbes #13 : (modèle: prendre)
					racine = verbe.substr(0, verbe.lastIndexOf("endre"));
					terminaisons = [
						["enais", "enais", "enait", "enions", "eniez", "enaient"],
						["ends", "ends", "end", "enons", "enez", "ennent"],
						["endrai", "endras", "endra", "endrons", "endrez", "endront"],
						["is", "enant"]
					];
					break;
				case 14:// verbes #14 : (modèle: mettre)
					racine = verbe.substr(0, verbe.lastIndexOf("ettre"));
					terminaisons = [
						["ettais", "ettais", "ettait", "ettions", "ettiez", "ettaient"],
						["ets", "ets", "et", "ettons", "ettez", "ettent"],
						["ettrai", "ettras", "ettra", "ettrons", "ettrez", "ettront"],
						["is", "ettant"]
					];
					break;
				case 15:// verbes #15 : (modèle: essuyer/employer)
					racine = verbe.substr(0, verbe.lastIndexOf("yer"));
					terminaisons = [
						["yais", "yais", "yait", "yions", "yiez", "yaient"],
						["ie", "ies", "ie", "yons", "yez", "ient"],
						["ierai", "ieras", "iera", "ierons", "ierez", "ieront"],
						["yé", "yant"]
					];
					break;
				case 16:// verbes #16 : (modèle: ouvrir)
					racine = verbe.substr(0, verbe.lastIndexOf("rir"));
					terminaisons = [
						["rais", "rais", "rait", "rions", "riez", "raient"],
						["re", "res", "re", "rons", "rez", "rent"],
						["rirai", "riras", "rira", "rirons", "rirez", "riront"],
						["ert", "rant"]
					];
					break;
				case 17:// verbes #17 : (modèle: battre)
					racine = verbe.substr(0, verbe.lastIndexOf("tre"));
					terminaisons = [
						["tais", "tais", "tait", "tions", "tiez", "taient"],
						["s", "s", "", "tons", "tez", "tent"],
						["trai", "tras", "tra", "trons", "trez", "tront"],
						["tu", "tant"]
					];
					break;
				case 18:// verbes #18 : (modèle: écrire)
					racine = verbe.substr(0, verbe.lastIndexOf("re"));
					terminaisons = [
						["vais", "vais", "vait", "vions", "viez", "vaient"],
						["s", "s", "t", "vons", "vez", "vent"],
						["rai", "ras", "ra", "rons", "rez", "ront"],
						["t", "vant"]
					];
					break;
			}

			var ligne, terminaison;
			for (var t = 0; t < 4; ++t) {
				ligne = [];
				for (var p = 0; p < 6; ++p) {
					terminaison = terminaisons[t][p] || "";
					if (inter.length > 0) {
						terminaison = terminaison.replace(/_/g, inter);
					}
					ligne.push(racine + terminaison);
				}
				formes.push(ligne);
			}
		} else { // conjugaisons irrégulières ou non encore catégorisées
			switch (verbe) {
				case "être":
					formes = [
						["étais", "étais", "était", "étions", "étiez", "étaient"],
						["suis", "es", "est", "sommes", "êtes", "sont"],
						["serai", "seras", "sera", "serons", "serez", "seront"],
						["été", "étant"]
					];
					break;
				case "avoir":
					formes = [
						["avais", "avais", "avait", "avions", "aviez", "avaient"],
						["ai", "as", "a", "avons", "avez", "ont"],
						["aurai", "auras", "aura", "aurons", "aurez", "auront"],
						["eu", "ayant"]
					];
					break;
				case "aller":
					formes = [
						["allais", "allais", "allait", "allions", "alliez", "allaient"],
						["vais", "vas", "va", "allons", "allez", "vont"],
						["irai", "iras", "ira", "irons", "irez", "iront"],
						["allé", "allant"]
					];
					break;
				case "devoir":
					formes = [
						["devais", "devais", "devait", "devions", "deviez", "devaient"],
						["dois", "dois", "doit", "devons", "devez", "doivent"],
						["devrai", "devras", "devra", "devrons", "devrez", "devront"],
						["du", "devant"]
					];
					break;
				case "voir":
					formes = [
						["voyais", "voyais", "voyait", "voyions", "voyiez", "voyaient"],
						["vois", "vois", "voit", "voyons", "voyez", "voient"],
						["verrai", "verras", "verra", "verrons", "verrez", "verront"],
						["vu", "voyant"]
					];
					break;
				case "savoir":
					formes = [
						["savais", "savais", "savait", "savions", "saviez", "savaient"],
						["sais", "sais", "sait", "savons", "savez", "savent"],
						["saurai", "sauras", "saura", "saurons", "saurez", "sauront"],
						["su", "sachant"]
					];
					break;
				case "pouvoir":
					formes = [
						["pouvais", "pouvais", "pouvait", "pouvions", "pouviez", "pouvaient"],
						["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"],
						["pourrai", "pourras", "pourra", "pourrons", "pourrez", "pourront"],
						["pu", "pouvant"]
					];
					break;
				case "résoudre":
					formes = [
						["résolvais", "résolvais", "résolvait", "résolvions", "résolviez", "résolvaient"],
						["résous", "résous", "résout", "résolvons", "résolvez", "résolvent"],
						["résoudrai", "résoudras", "résoudra", "résoudrons", "résoudrez", "résoudront"],
						["résolu", "résolvant"]
					];
					break;
				case "mordre":
					formes = [
						["mordais", "mordais", "mordait", "mordions", "mordiez", "mordaient"],
						["mords", "mords", "mord", "mordons", "mordez", "mordent"],
						["mordrai", "mordras", "mordra", "mordrons", "mordrez", "mordront"],
						["mordu", "mordant"]
					];
					break;
				case "appeler":
					formes = [
						["appelais", "appelais", "appelait", "appelions", "appeliez", "appelaient"],
						["appelle", "appelles", "appelle", "appelons", "appelez", "appellent"],
						["appellerai", "appelleras", "appellera", "appellerons", "appellerez", "appelleront"],
						["appelé", "appelant"]
					];
					break;
				case "jeter":
					formes = [
						["jetais", "jetais", "jetait", "jetions", "jetiez", "jetaient"],
						["jette", "jettes", "jette", "jetons", "jetez", "jettent"],
						["jetterai", "jetteras", "jettera", "jetterons", "jetterez", "jetteront"],
						["jeté", "jetant"]
					];
					break;
				case "projeter":
					formes = [
						["projetais", "projetais", "projetait", "projetions", "projetiez", "projetaient"],
						["projette", "projettes", "projette", "projetons", "projetez", "projettent"],
						["projetterai", "projetteras", "projettera", "projetterons", "projetterez", "projetteront"],
						["projeté", "projetant"]
					];
					break;
				case "envoyer":
					formes = [
						["envoyais", "envoyais", "envoyait", "envoyions", "envoyiez", "envoyaient"],
						["envoie", "envoies", "envoie", "envoyons", "envoyez", "envoient"],
						["enverrai", "enverras", "enverra", "enverrons", "enverrez", "enverront"],
						["envoyé", "envoyant"]
					];
					break;
				case "faire":
					formes = [
						["faisais", "faisais", "faisait", "faisions", "faisiez", "faisaient"],
						["fais", "fais", "fait", "faisons", "faites", "font"],
						["ferai", "feras", "fera", "ferons", "ferez", "feront"],
						["fait", "faisant"]
					];
					break;
				case "vouloir":
					formes = [
						["voulais", "voulais", "voulait", "voulions", "vouliez", "voulaient"],
						["veux", "veux", "veut", "voulons", "voulez", "veulent"],
						["voudrai", "voudras", "voudra", "voudrons", "voudrez", "voudront"],
						["voulu", "voulant"]
					];
					break;
				case "croire":
					formes = [
						["croyais", "croyais", "croyait", "croyions", "croyiez", "croyaient"],
						["crois", "crois", "croit", "croyons", "croyez", "croient"],
						["croirai", "croiras", "croira", "croirons", "croirez", "croiront"],
						["cru", "croyant"]
					];
					break;
				case "craindre":
					formes = [
						["craignais", "craignais", "craignait", "craignions", "craigniez", "craignaient"],
						["crains", "crains", "craint", "craignons", "craignez", "craignent"],
						["craindrai", "craindras", "craindra", "craindrons", "craindrez", "craindront"],
						["craint", "craignant"]
					];
					break;
				case "rire":
					formes = [
						["riais", "riais", "riait", "riions", "riiez", "riaient"],
						["ris", "ris", "rit", "rions", "riez", "rient"],
						["rirai", "riras", "rira", "rirons", "rirez", "riront"],
						["ri", "riant"]
					];
					break;
				case "lire":
					formes = [
						["lisais", "lisais", "lisait", "lisions", "lisiez", "lisaient"],
						["lis", "lis", "lit", "lisons", "lisez", "lisent"],
						["lirai", "liras", "lira", "lirons", "lirez", "liront"],
						["lu", "lisant"]
					];
					break;
				case "dire":
					formes = [
						["disais", "disais", "disait", "disions", "disiez", "disaient"],
						["dis", "dis", "dit", "disons", "dites", "disent"],
						["dirai", "diras", "dira", "dirons", "direz", "diront"],
						["dit", "disant"]
					];
					break;
				case "interdire":
					formes = [
						["interdisais", "interdisais", "interdisait", "interdisions", "interdisiez", "interdisaient"],
						["interdis", "interdis", "interdit", "interdisons", "interdisez", "interdisent"],
						["interdirai", "interdiras", "interdira", "interdirons", "interdirez", "interdiront"],
						["interdit", "interdisant"]
					];
					break;
				case "suivre":
					formes = [
						["suivais", "suivais", "suivait", "suivions", "suiviez", "suivaient"],
						["suis", "suis", "suit", "suivons", "suivez", "suivent"],
						["suivrai", "suivras", "suivra", "suivrons", "suivrez", "suivront"],
						["suivi", "suivant"]
					];
					break;
				case "vivre":
					formes = [
						["vivais", "vivais", "vivait", "vivions", "viviez", "vivaient"],
						["vis", "vis", "vit", "vivons", "vivez", "vivent"],
						["vivrai", "vivras", "vivra", "vivrons", "vivrez", "vivront"],
						["vécu", "vivant"]
					];
					break;
				case "perdre":
					formes = [
						["perdais", "perdais", "perdait", "perdions", "perdiez", "perdaient"],
						["perds", "perds", "perd", "perdons", "perdez", "perdent"],
						["perdrai", "perdras", "perdra", "perdrons", "perdrez", "perdront"],
						["perdu", "perdant"]
					];
					break;
				case "dormir":
					formes = [
						["dormais", "dormais", "dormait", "dormions", "dormiez", "dormaient"],
						["dors", "dors", "dort", "dormons", "dormez", "dorment"],
						["dormirai", "dormiras", "dormira", "dormirons", "dormirez", "dormiront"],
						["dormi", "dormant"]
					];
					break;
				case "courir":
					formes = [
						["courais", "courais", "courait", "courions", "couriez", "couraient"],
						["cours", "cours", "court", "courons", "courez", "courent"],
						["courrai", "courras", "courra", "courrons", "courrez", "courront"],
						["couru", "courant"]
					];
					break;
				case "recourir":
					formes = [
						["recourais", "recourais", "recourait", "recourions", "recouriez", "recouraient"],
						["recours", "recours", "recourt", "recourons", "recourez", "recourent"],
						["recourrai", "recourras", "recourra", "recourrons", "recourrez", "recourront"],
						["recouru", "recourant"]
					];
					break;
				case "mourir":
					formes = [
						["mourais", "mourais", "mourait", "mourions", "mouriez", "mouraient"],
						["meurs", "meurs", "meurt", "mourons", "mourez", "meurent"],
						["mourrai", "mourras", "mourra", "mourrons", "mourrez", "mourront"],
						["mort", "mourant"]
					];
					break;
				case "plaire":
					formes = [
						["plaisais", "plaisais", "plaisait", "plaisions", "plaisiez", "plaisaient"],
						["plais", "plais", "plaît", "plaisons", "plaisez", "plaisent"],
						["plairai", "plairas", "plaira", "plairons", "plairez", "plairont"],
						["plu", "plaisant"]
					];
					break;
				case "nuire":
					formes = [
						["nuisais", "nuisais", "nuisait", "nuisions", "nuisiez", "nuisaient"],
						["nuis", "nuis", "nuit", "nuisons", "nuisez", "nuisent"],
						["nuirai", "nuiras", "nuira", "nuirons", "nuirez", "nuiront"],
						["nui", "nuisant"]
					];
					break;
				case "fuir":
					formes = [
						["fuyais", "fuyais", "fuyait", "fuyions", "fuyiez", "fuyaient"],
						["fuis", "fuis", "fuit", "fuyons", "fuyez", "fuient"],
						["fuirai", "fuiras", "fuira", "fuirons", "fuirez", "fuiront"],
						["fui", "fuyant"]
					];
					break;
				case "enfuir":
					formes = [
						["enfuyais", "enfuyais", "enfuyait", "enfuyions", "enfuyiez", "enfuyaient"],
						["enfuis", "enfuis", "enfuit", "enfuyons", "enfuyez", "enfuient"],
						["enfuirai", "enfuiras", "enfuira", "enfuirons", "enfuirez", "enfuiront"],
						["enfui", "enfuyant"]
					];
					break;
				case "£aïr":
					formes = [
						["£aïssais", "£aïssais", "£aïssait", "£aïssions", "£aïssiez", "£aïssaient"],
						["£ais", "£ais", "£ait", "£aïssons", "£aïssez", "£aïssent"],
						["£aïrai", "£aïras", "£aïra", "£aïrons", "£aïrez", "£aïront"],
						["£aï", "£aïssant"]
					];
					break;
			}
		}

		var retour = formes[temps - 1][personne - 1];
		var abbrev = false;
		if (pronominal) {
			prefixe = Grimoire.pronomsReflexifs[(persParticipe > 0) ? (persParticipe - 1) : (personne - 1)] + " ";
			if (retour.voyelle() && (prefixe.indexOf("e") > -1)) {
				abbrev = true;
			}
		}
		retour = prefixe + retour;
		if (abbrev) {
			retour = retour.replace(/e /, "'");
		}
		return retour;
	}
};

function _GENERATEUR_() { /* pour structurer la liste des functions dans NotePad++ */
}
var Generateur = {

	Memoire: {
		generations: 0,
		precedenteStructure: null,
		longueurAuChoix: null,
		longueurFixe: false,
		sujetAuChoix: null,
		audio: false
	},

	Articles: {
		articlesDef: ["le*_la*", "les"],
		articlesIndef: ["un_une", "des"],
		//articlesParti: ["du", "de la"],
		articlesDemo: ["ce€_cette", "ces"],
		articlesPossS: ["mon_ma", "ton_ta", "son_sa", "notre", "votre", "leur"],
		articlesPossP: ["mes", "tes", "ses", "nos", "vos", "leurs"],
		quantifieurs: ["peu de*", "beaucoup de*", "plusieurs", "tous les_toutes les", "quelques", "la plupart des", "certains_certaines", "des dizaines de*", "des centaines de*", "des milliers de*", "un nombre incalculable de*µ", "%% pour cent des", "des £ordes de*", "des tas de*", "une série de*µ", "un groupe de*µ", "un certain nombre de*", "une boucherie de*", "une rangée de*", "une ribambelle de*", "une myriade de*", "un bouquet de*µ", "un paquet de*", "une armée de*"],
		PROBA_QUANTIFIEURS: [5, 7, 7, 8, 8, 6, 7, 2, 2, 2, 3, 6, 1, 2, 2, 2, 3, 1, 1, 1, 1, 1, 2, 1]
	},

	GN: {
		PROBA_PRONOMS_PERS: [2, 2, 1, 2, 2, 1],
		nomsCommuns: ["femme_F", "homme_H", "humain_H", "personne_F", "inconnu%e", "garçon_H", "fille_F", "fou%folle", "assassin_H", "médecin_H", "plombier_H", "ministre_N", "spectateur%spectatrice", "visiteur_H", "français²%française", "célébrité_F", "intrus²_H", "chercheur%chercheuse", "enseignant%e", "rebelle_N", "musicien%musicienne", "poète_H", "soldat_H", "artiste_N", "flic_H", "touriste_N", "esprit_H", "âme_F", "enfant_H", "citoyen%citoyenne", "fumeur%fumeuse", "mec%nana", "allemand%e", "italien%italienne", "belge_N", "américain%e", "russe_N", "facteur_H", "infirmier%infirmière", "salarié%e", "mère²s de famille_F", "traitre_H", "spécialiste_N", "joueur%joueuse", "pianiste_N", "journaliste_N", "évèque_H", "délégué²s du personnel%déléguée²s du personnel", "stagiaire_N", "candidat%e", "responsable_N", "adolescent%e", "bébé_H", "propriétaire_N", "locataire_N", "commerçant%e", "aristocrate_N", "victime_F", "blessé²s de guerre_H", "orphelin%e", "passager_H", "électeur%électrice", "usager²s des transports en commun_H", "chef²s d'orchestre_H", "prisonnier²s politique²s%prisonnière²s politique²s", "informaticien_H", "prédateur_H", "membre²s du parti", "acteur%actrice", "individu²s armé²s_H", "participant%e", "handicapé%e", "sportif%sportive", "chômeur%chômeuse", "toxicomane_N", "habitant%e", "pirate_H", "collaborateur%collaboratrice", "marchand²s d'esclaves_H", "philatéliste_N", "client%e", "automobiliste_N", "collectionneur%collectionneuse", "invité%e", "interlocuteur%interlocutrice", "pompier_H", "ouvrier%ouvrière", "secrétaire_F", "hôtesse²s de l'air_F", "danseur%danseuse", "élève_N", "criminel²s de guerre_H", "spéculateur%spéculatrice", "diplomate_H", "alcoolique_H", "organisateur%organisatrice", "plaisantin_H", "tricheur%tricheuse", "fraudeur%fraudeuse", "menteur%menteuse", "prêtre%prêtresse", "moine²s franciscain²s%nonne", "éleveur²s de porcs_H", "propriétaire²s de casino²s_H", "pilote²s de ligne_H", "pilier²s de bar_H", "peintre²s en bâtiment_H", "humoriste_N", "arabe_N", "sénégalais²%sénégalaise", "malade_N", "chinois²%chinoise", "japonais²%japonaise", "indien%indienne", "indigène_N", "scientifique_N", "éboueur_H", "chasseur_H", "écologiste_N", "boucher_H", "architecte_N", "banquier%banquière", "clochard%e", "punk_N", "gitan%e", "coiffeur%coiffeuse", "écrivain_H", "terroriste_H", "martyr%e", "acrobate²s de cirque_N", "psychologue²s du travail_N", "psychopathe_N", "saint%e", "£éros²%héroïne", "champion²s de tir%championne²s de tir", "spéléologue_N", "célibataire_N", "anorexique_N", "cascadeur%cascadeuse", "patron_H", "consultant%e", "philosophe_N", "universitaire_H", "académicien%académicienne", "étudiant%e", "lycéen%lycéenne", "collégien%collégienne", "mercenaire_H", "vigile²s de supermarché²s_H", "comptable_H", "non-fumeur%non-fumeuse", "descendant²s des incas%descendante²s des incas", "mendiant%e", "brute_F", "entité_F", "association_F", "société_F", "entreprise_F", "organisme%organisation", "groupe_H", "artisan_H", "voleur%voleuse", "mutant%e", "garde²s du corps_H", "chrétien%chrétienne", "musulman%e", "juif%juive", "protestant%e", "bouddhiste_N", "athée_N", "vieillard_H", "multi-récidiviste_N", "choriste_N", "voyageur%voyageuse", "vagabond_H", "imposteur_H", "clandestin_H", "brigand_H", "voyou_H", "député%e", "maire_H", "sénateur%sénatrice", "émigrant%e", "paysan%paysanne", "fantôme_H", "concurrent%e", "arbitre_H", "conspirateur%conspiratrice", "énergumène_H", "laveur²s de carreaux_H", "monstre_H", "inspecteur%inspectrice", "parisien%parisienne", "émir_H", "fonctionnaire_H", "officier²s supérieur²s_H", "sous-fifre_H", "païen%païenne", "sauvage_N", "prostituée_F", "funambule_H", "amateur%amatrice", "maître%maîtresse", "professionnel%professionnelle", "bénévole_H", "donateur%donatrice", "capitaine_H", "cavalier%cavalière", "créature_F", "notaire_H", "adulte_H", "ancêtre_H", "internaute_N", "astrophysicien_H", "joueur²s de ping-pong%joueuse²s de ping-pong", "clarinettiste_N", "joueur²s de poker%joueuse²s de poker", "croupier%croupière", "concierge_N", "kamikaze_H", "cycliste_N", "pensionnaire_N", "millionnaire_N", "milliardaire_N", "femme²s de ménage_F", "poissonnier%poissonnière", "fleuriste_N", "critique²s de films_N", "photographe_N", "justicier%justicière", "piéton", "gamin%e", "vétéran_H", "promeneur%promeneuse", "autochtone_N", "espion%espionne", "agent_H", "être_H", "motard_H", "dissident%e", "gardien²s de phare_H", "végétarien%végétarienne", "athlète²s de £aut niveau_N", "charlatan_H", "voleur²s de poules_H", "animateur²s de colonie²s de vacances%animatrice²s de colonie²s de vacances", "animateur²s de centre²s aéré²s%animatrice²s de centre²s aéré²s", "illuminé%e", "anarchiste_N", "communiste_N", "serbe_N", "archéologue_N", "puériculteur%puéricultrice", "jongleur%jongleuse", "clown_H", "colporteur_H", "pollueur%pollueuse", "instituteur%institutrice", "cow-boy_H", "rigolo_H", "emmerdeur%emmerdeuse", "pigeon_H", "filou_H", "délinquant%e", "vampire_H", "cobaye_H", "colonel_H", "salaud_H", "ordure_F", "proxénète_H", "mannequin_H", "déménageur_H", "scout_H", "courtier_H", "assureur_H", "gladiateur_H", "haltérophile_H", "figurant%e", "pignouf_H", "connasse_F", "idole_F", "masseur-kinésithérapeute²²masseurs-kinésithérapeutes_H", "salopard_H", "troll_H", "intelligence²s artificielle²s_F", "blaireau²x_H", "pilote²s de rallye_H", "lanceur²s de couteaux_H", "saltimbanque_H", "bricoleur²s du dimanche_H", "chanteur²s de salle de bain_H", "arnaqueur%arnaqueuse", "anachorète_H", "polytechnicien%polytechnicienne", "énarque_N", "laquais²_H", "malandrin_H", "violoncelliste_N", "pacifiste_N", "belligérant%e", "imitateur%imitatrice", "schoïnopenxatophile_H", "tordu%e", "oto-rhino-laryngologiste_N", "déglingué_H", "extra-terrestre_H", "horloger%horlogère", "pâtissier%pâtissière", "birman%e", "apatride_N", "maître-saucier_H", "auteur²s de science-fiction_H", "travesti_H", "greffier%greffière", "braqueur²s de banques_H", "moniteur²s de parapente%monitrice²s de parapente", "moniteur²s d'auto-école%monitrice²s d'auto-école", "professeur²s de français_H", "professeur²s d'éducation physique_H", "professeur²s d'anglais_H", "fiscaliste_H", "croque-mort_H", "policier_H", "gendarme_H", "douanier%douanière", "cancérologue_N", "percussionniste_N", "audio-prothésiste_N", "dessinateur%dessinatrice", "illustrateur%illustratrice", "contribuable_H", "patient%e", "brancardier_H", "anesthésiste_N", "cadre²s supérieur²s_H", "andouille_F", "iconoclaste_N", "crétin_H", "gréviste_H", "combattant%e", "histrion_H", "mathématicien%mathématicienne", "gigolo_H", "galopin_H", "trafiquant²s d'armes_H", "plongeur%plongeuse", "ivrogne_H", "politicien%politicienne", "sumo_H", "flutiste_N", "motocycliste_N", "technocrate_H", "socialiste_N", "réfugié%e", "magicien%magicienne", "sorcier%sorcière", "rénégat_H", "hérétique_N", "tatoueur%tatoueuse", "noctambule_N", "bureaucrate_N", "hurluberlu%e", "bourgeois²%bourgeoise", "derviche_H", "névropathe_N", "sociopathe_N", "maraudeur_H", "félon_H", "australopithèque_H", "pithécanthrope_H", "singe_H", "charcutier_H", "ramasseur²s de balles%ramasseuse²s de balles", "sculpteur_H", "cyclomotoriste_N", "usager%usagère", "fillette_F", "amant%e", "ténor%diva", "numismate_H", "jardinier%jardinière", "botaniste_N", "agent²s d'assurances_H", "copain%copine", "pote_H", "avocat%e", "huissier²s de justice_H", "procureur_H", "trafiquant²s de cocaïne_H", "chauffeur²s de salle_H", "chauffeur²s routier²s_H", "pasteur_H", "diacre_H", "apôtre_H", "donneur²s d'organes%donneuse²s d'organes", "portugais²%portugaise", "manifestant%e", "comique²s troupier²s_H", "ingénieur_H", "trapéziste_N", "charpentier_H", "bandit_H", "nourrice_F", "graphiste_N", "ambulancier%ambulancière", "faussaire_N", "maître d'hôtel_H", "serveur%serveuse", "particulier_H", "magouilleur_H", "cinéphile_N", "herbivore_N", "anthropophage_N", "£ongrois²%£ongroise", "québecois²%québecoise", "marchand²s de tapis%marchande²s de tapis", "laborantin%e", "protagoniste_N", "zombie_H", "fabuliste_H", "écuyer%écuyère", "cocher_H", "entraîneur%entraîneuse", "illusionniste_N", "professeur²s de yoga_H", "souffleur²s de verre_H", "caissier%caissière", "gredin_H", "bouilleur²s de cru_H", "esthète_N", "gastro-entérologue_N", "tzigane_N", "fumiste_N", "grossiste_H", "sidérurgiste_H", "hypocrite_N", "juge_N", "juré%e", "juge²s d'instruction_N", "juge²s de touche_H", "chocolatier_H", "bûcheron_H", "acteur²s de films pornographiques%actrice²s de films pornographiques", "taliban_H", "herméneute_H", "exégète_H", "explorateur%exploratrice", "philologue_N", "sociologue_N", "prétendant%e", "courtisan%e", "gouverneur_H", "encyclopédiste_H", "entomologiste_H", "agitateur%agitatrice", "paléontologue_H", "agent²s en immobilier_H", "agent²s de police_H", "primate_H", "flamand%e", "gymnaste_N", "aide-soignant%e", "doxographe_N", "pleurnichard_H", "binoclard%e", "formateur%formatrice", "druide%druidesse", "allumeur²s de réverbères_H", "manipulateur%manipulatrice", "palefrenier_H", "imbécile_N", "feignant%e", "prestidigitateur%cartomancienne", "dilettante_H", "stoïcien%stoïcienne", "épicurien%épicurienne", "taoïste_N", "taulard%e", "troubadour_H", "ménestrel_H", "assesseur_H", "assistant%e", "manutentionnaire_H", "golfeur%golfeuse", "cruciverbiste_N", "lyonnais²%lyonnaise", "marseillais²%marseillaise", "nancéien%nancéienne", "éditorialiste_N", "magistrat%e", "malfrat_H", "gueux²%gueuse", "serf_H", "suzerain_H", "féal²²féaux%féale", "fakir_H", "personnage_H", "personnalité_F", "membre²s du personnel_H", "cyclope_H", "compagnon%compagne", "plaignant%e", "robot_H", "chasseur²s alpin²s_H", "glandeur%glandeuse", "moussaillon_H", "maquettiste_N", "copilote_N", "ostréiculteur%ostréicultrice", "taxidermiste_N", "opérateur%opératrice", "frimeur%frimeuse", "goinfre_N", "pitre_H", "passant%e", "vigneron_H", "testeur²s de jeux vidéo_H", "apprenti_H", "directeur²s de cabinet%directrice²s de cabinet", "directeur%directrice", "recteur_H", "préfet_H", "sous-préfet_H", "larbin_H", "pantin_H", "caïd_H", "voyeur%voyeuse", "séducteur%séductrice", "obsédé%nymphomane", "guignol_H", "casseur_H", "vandale_H", "démineur_H", "sténodactylographe_F", "pigiste_N", "£iérarque_H", "gérontologue_N", "margoulin_H", "ferrailleur_H", "occultiste_N", "virtuose_N", "armateur_H", "rapace_H", "actionnaire_N", "activiste_N", "adhérent%e", "agriculteur%agricultrice", "bouffon_H", "bouseux²%bouseuse", "cartomancien%cartomancienne", "chef²s d'entreprise_H", "chef²s de cuisine_H", "compère%commère", "compositeur%compositrice", "conseiller%conseillère", "couturier%couturière", "dirigeant%e", "développeur_H", "détenu%e", "entrepreneur_H", "ange_H", "fée_F", "lutin_H", "démon_H", "loup-garou²²loups-garous_H", "franc-maçon²²francs-maçons%franc-maçonne²²francs-maçonnes", "métaphysicien%métaphysicienne", "physicien%physicienne", "garagiste_H", "garde²s champêtre²s_H", "gardien²s de but_H", "gêneur%gêneuse", "gourou_H", "expert%e", "guichetier%guichetière", "héritier%héritière", "instructeur%instructrice", "investigateur%investigatrice", "maçon_H", "commissaire²s de police_H", "commissaire²s aux comptes_H", "marin_H", "magnétiseur_H", "marabout_H", "maître-nageur²²maîtres-nageurs_H", "sauveteur_H", "militant%e", "milicien%milicienne", "mort-vivant²²morts-vivants_H", "naufragé%e", "nourrisson_H", "orthophoniste_N", "hypnotiseur_H", "parachutiste_N", "peintre_H", "portier_H", "porteur_H", "potier_H", "cancre_H", "psychanaliste_N", "rentier%rentière", "rescapé%e", "rédacteur%rédactrice", "skieur%skieuse", "patineur%patineuse", "sommelier%sommelière", "syndicaliste_N", "thérapeute_N", "survivant%e", "tueur²s à gages%tueuse²s à gages", "vacancier%vacancière", "trublion_H", "élu%e", "électricien%électricienne", "gondolier_H", "goujat_H", "antimilitariste_N", "insurgé%e", "assaillant%e", "commentateur%commentatrice", "compétiteur_H", "bretteur_H", "tireur²s d'élite_H", "oligarque_H", "éminence_F", "altermondialiste_N", "archiduc%archiduchesse", "conscrit%e", "empereur%impératrice", "esquimau²x%esquimaude", "gnome_H", "géant%e", "nain%e", "marquis²%marquise", "prince%princesse", "sultan_H", "calife_H", "scribe_H", "roi%reine", "souverain%e", "manchot_H", "ami%e", "amiral²²amiraux_H", "cantatrice_F", "chauffard_H", "cheminot_H", "corse_N", "émissaire_H", "éradicateur_H", "flibustier_H", "fournisseur_H", "limier_H", "libraire_N", "livreur_H", "partenaire_N", "partisan%e", "penseur_H", "postulant%e", "ogre%ogresse", "orateur%oratrice", "prédicateur%prédicatrice", "prélat_H", "résistant%e"],
		complementNomPost: ["en retraite²", "à trois sous²", "sans papiers²", "sans défense²", "sans scrupules²", "grièvement blessé%e", "professionnel%professionnelle", "obèse", "rachitique", "en chaussettes²", "en costume²s traditionnel²s", "en extase²", "sous hypnose²", "en rut²%enceinte", "complètement taré%e", "ivre²s mort²s%ivre²s morte²s", "stressé%e", "détendu%e", "exceptionnel%exceptionnelle", "d'autrefois²", "diplômé%e", "volontaire", "amateur%amatrice", "senior²", "en herbe²", "agressif%agressive", "mélancolique", "en liberté conditionnelle²", "solennel%solennelle", "breton%bretonne", "parisien%parisienne", "confirmé%e", "génial²²géniaux%géniale", "abruti%e", "hilare", "consterné%e", "acharné%e", "outrageusement dénudé%e", "au grand coeur²", "richissime", "charismatique", "aux yeux cernés²", "à lunettes²", "décoiffé%e", "cynique", "bavard%e", "élégant%e", "en délire²", "surexcité%e", "enragé%e", "à l'agonie²", "sans ambition²", "inconnu%e", "somnambule", "hélitreuillé%e", "armé²s jusqu'aux dents%armée²s jusqu'aux dents", "aux intentions pacifiques²", "barbu%à forte poitrine²", "à moitié endormi%e", "de passage²", "en bermuda²", "sans histoires²", "maladroit%e", "affamé%e", "repu%e", "moustachu%aux longs cils²", "mercenaire", "agé²s de & ans%agée²s de & ans", "de mauvaise humeur²", "en armure²s de combat", "vivant dans & mètres carrés²", "entouré²s de & gardes du corps", "poussant des hurlements gutturaux²", "invisible", "sénile", "mal élevé%e", "cruel%cruelle", "spécialiste²s en nouvelles technologies", "en bonne santé²", "disponible", "bénévole", "sous contrat²", "écervelé%e", "en surpoids²", "en manque d'action²", "de gauche²", "de droite²", "communiste", "capitaliste", "itinérant%e", "ambulant%e", "désespéré%e", "fou²s de joie%folle²s de joie", "en voyage²", "en mission²", "en tenue de camouflage²", "dispensé²s de sport%dispensée²s de sport", "sous-payé%e", "en détresse²", "de carnaval²", "au bord du suicide²", "porteur²s du virus de la grippe A%porteuse²s du virus de la grippe A", "mal coiffé%e", "endormi%e", "sous calmants²", "névrosé%e", "venu²s du futur%venue²s du futur", "à l'haleine nauséabonde²", "engagé%e", "mort-vivant²²morts-vivants%morte-vivante²²mortes-vivantes", "sous haute surveillance²", "optimiste", "pessimiste", "par intérim²", "adipeux²%adipeuse", "cannibale", "impatient%e", "en tenue de soirée²", "chauve", "anormalement poilu%e", "myope", "bossu%e", "aux dents pourries²", "relaps²%relapse", "tatoué%e", "ridé%e", "au crâne rasé²", "à la voix pâteuse²", "exalté%e", "inspiré%e", "vêtu²s de pétales de roses%vêtue²s de pétales de roses", "joufflu%e", "candide", "hirsute", "analphabète", "atrocement mutilé%e", "presque aveugle", "sourd-muet%sourde-muette", "assis²%assise", "arrogant%e", "rémunéré²s à hauteur de & euros par jour%rémunérée²s à hauteur de & euros par jour", "euphorique", "asthmatique", "au groin gluant²", "inscrit²s au club de sumo%inscrite²s au club de sumo", "ensablé²s jusqu'au cou%ensablée²s jusqu'au cou", "pointilleux²%pointilleuse", "bourré²s d'antibiotiques%bourrée²s d'antibiotiques", "en costume trois-pièces²%en robe de soirée²", "mandaté²s par le gouvernement%mandatée²s par le gouvernement", "élevé²s en plein air%élevée²s en plein air", "boiteux²%boiteuse", "allergique²s au pollen", "en vélo²", "à pied²", "possédé²s par le diable%possédée²s par le diable", "pyromane", "intérimaire", "exemplaire", "résigné²s à mourrir%résignée²s à mourrir", "légendaire", "mythique", "athlétique", "cyclothymique", "ahuri%e", "salement amoché%e", "décérébré%e", "condamné²s à perpétuité%condamnée²s à perpétuité", "allergique²s aux poils de loutre", "allergique²s au nitrate de fioul", "stérile", "enrhumé%e", "fétichiste²s du nombre \"&\"", "abonné²s au Monde Diplomatique%abonnée²s au Monde Diplomatique", "abonné²s à & chaînes de télévision%abonnée²s à & chaînes de télévision", "à la démarche cavalière²", "aux intentions incertaines²", "à l'article de la mort²", "en costume du dimanche²%maquillée²s et coiffée²s", "aux pieds fourchus²", "aux doigts palmés²", "en grève de la faim depuis & jours²", "accoutumé²s au luxe%accoutumée²s au luxe", "aux moeurs spartiates²", "inactif%inactive", "catatonique", "amputé²s des genous%amputée²s des genous", "passionné²s d'histoire%passionnée²s d'histoire", "masqué%e", "prognathe", "obnubilé²s par la passion%obnubilée²s par la passion", "bête²s à manger du foin", "effronté%e", "dépendant²s aux anti-dépresseurs%dépendante²s aux anti-dépresseurs", "ayant de graves antécédents psychiatriques²", "totalement épanoui%e", "hémophile", "boulimique", "bipolaire", "extrêmement frileux²%extrêmement frileuse", "irréaliste", "idéaliste", "terre à terre²", "perfectionniste", "hermétique", "ésotérique", "nourri²s d'algues vertes%nourrie²s d'algues vertes", "aux pupilles dilatées²", "en contrat de qualification²", "déterminé²s à aller jusqu'au bout%déterminée²s à aller jusqu'au bout", "sorti²s du coma depuis & minutes%sortie²s du coma depuis & minutes", "mandchou%e", "illettré%e", "à mi-temps²", "touchant une pension de deuxième ou de troisième catégorie²", "porté²s disparu²s%portée²s disparue²s", "obtus²%obtuse", "svelte", "corpulent%e", "un peu coincé%e", "ventripotent%e", "perclus²%percluse", "aphone", "ougandais²%ougandaise", "imaginaire", "vertueux²%vertueuse", "jovial²²joviaux%joviale", "griffu%e", "disert%e", "loquace", "prolixe", "volubile", "versatile", "laconique", "congelé%e", "daltonien%daltonienne", "incarcéré²s pour meurtre%incarcérée²s pour meurtre", "invaincu²s en & rencontres%invaincue²s en & rencontres", "valétudinaire", "végétarien%végétarienne", "à la solde de l'ennemi²"],
		pronomsPers: ["je@1", "tu@2", "il_elle@3", "nous@4", "vous@5", "ils_elles@6"],
		nomsPropres: ["Coluche", "Barack Obama", "Emmanuel Macron", "Plastic Bertrand", "Winston Churchill", "Casimir", "Gandhi", "Mike Tyson", "Pablo Picasso", "Toshiro Mifune", "Boris Vian", "Mère Thérésa_F", "Jeanne Calment_F", "Sid Vicious", "Bourvil", "Wolfgang Amadeus Mozart", "Jésus", "Jean-Marie Le Pen", "Vito Corleone", "Marcel Gotilb", "Baruch Spinoza", "Joe Dalton", "Michael Jackson", "Jean-Paul II", "Louis XIV", "Charlemagne", "Léonard De Vinci", "Nicolas Sarkozy", "Satan", "µannick Noah", "Claire Chazal_F", "Sigourney Weaver_F", "Billie Holliday_F", "Sophie Marceau_F", "Lénine", "Robert Hue", "Stanley Kubrick", "Stephen King", "Albert Einstein", "Johnny Depp", "Roselyne Bachelot_F", "Judas", "Bernard Tapie", "Pedro Almodovar", "Keny Arcana_F", "Enzo Ferrari", "Francis Ford Coppola", "Jean-Claude Van Damme", "Laurent Joffrin", "Bernadette Chirac_F", "Jean Tibéri", "Ronald Mac Donald", "Herbert Léonard", "Carlos Santana", "µann Arthus-Bertrand", "Hector de Troie", "Merlin l'enchanteur", "Walt Disney", "Tim Burton", "Clint Eastwood", "Henri Poincaré", "David Lynch", "Abraham Lincoln", "Bernard-Henri Lévy", "Francis Cabrel", "Nana Mouskouri_F", "Gérard Holtz", "Arnold Schwartzenegger", "Joséphine Baker_F", "Victoria Abril_F", "Carole Bouquet_F", "Michel Serrault", "Michael Jordan", "Alain Gillot-Pétré", "Arlette Laguiller_F", "Bill Clinton", "Bill Gates", "Carla Bruni_F", "Dora l'exploratrice_F", "Victor Hugo", "Nicolas Hulot", "Bob l'éponge", "Bela Lugosi", "Bin Laden", "Madonna_F", "Silvio Berlusconi", "Chuck Norris", "Babar", "Arsène Lupin", "Garcimore", "Lara Fabian_F", "Lino Ventura", "Batman", "Martin Luther King", "Robocop", "Tino Rossi", "Alfred Hitchcock", "Godzilla", "Vladimir Poutine", "Blanche-Neige_F", "King Kong", "Dark Vador", "Michel Platini", "Raymond Barre", "Paul Bocuse", "Dieudonné", "Pierre Desproges", "Staline", "Maïté_F", "Caroline de Monaco_F", "Laure Manaudou_F", "Ingrid Bettancourt_F", "Voltaire", "Karl Marx", "Zorro", "Fidel Castro", "Serge Gainsbourg", "Georges Brassens", "l'incroyable Hulk", "Jean-Pierre Foucault", "Michel Foucault", "David Douillet", "Johnny Halliday", "Bob Marley", "Monica Bellucci_F", "Woody Allen", "Jean-Pierre Bacri", "Ségolène Royal_F", "Robert De Niro", "José Bové", "Olivier Besancenot", "Dracula", "Al Capone", "Ronald Reagan", "Jean-Luc Delarue", "Jean-Pierre Coffe", "Enrico Macias", "Marthe Villalonga_F", "Jacques Séguéla", "Umberto Eco", "François Fillon", "Doc Gynéco", "Neil Armstrong", "François Mitterand", "Fanny Ardant_F", "Alain Chabat", "Eric Cantona", "Che Guevara", "Alain Prost", "Léo Ferré", "Bobby Lapointe", "Raymond Devos", "la fée Clochette_F", "Eros Ramazzotti", "Stevie Wonder", "Georges Moustaki", "Lionel Jospin", "Albert Dupontel", "Cabu", "Frank Zappa", "Maradonna", "Mussolini", "Pascal Sevran", "Rachida Dati_F", "Gaston Lagaffe", "James Bond", "Indiana Jones", "µasser Arafat", "Bruce Lee", "Lucky Luke", "Jean-Paul Sartre", "Iggy Pop", "Basile Boli", "Arlette Chabot_F", "Sharon Stone_F", "Louis Armstrong", "Frank Sinatra", "Speedy Gonzales", "Spiderman", "Lady Di_F", "Gargantua", "Popeye le marin", "Oxmo Puccino", "Derrick", "James Dean", "Jean Moulin", "Robespierre", "Obélix", "Genghis Khan", "Jules César", "Platon", "Claude Nougaro", "John Travolta", "Gad Elmaleh", "Jamel Debbouze", "Michel Drucker", "Andy Warhol", "Marylin Monroe_F", "Shrek", "Napoléon", "Hitler", "Chantal Goya_F", "Machiavel", "Jim Carrey", "Mister T", "Jean Reno", "Lancelot Du Lac", "le roi Arthur", "Marie Curie_F", "Louis Pasteur", "Daniel Cohn-Bendit", "Jack Lang", "Jacques Chirac", "Hilary Clinton_F", "Tony Blair", "Kermit", "Viktor Frankenstein", "Superman", "Jacques Martin", "Sigmund Freud", "Britney Spears_F", "Emile Zola", "Antoine de Caunes", "Lakshmi Mittal", "Jeanne d'Arc_F", "Alain Juppé", "Dominique de Villepin", "Philippe Val", "Will Smith", "Bruce Willis", "Jacques Dutronc", "Philippe Léotard", "Robert Charlebois", "Bertrand Cantat", "Quasimodo", "Nikita Khrouchtchev", "µouri Gagarine", "John Wayne", "Borat", "Julien Courbet", "Laurent Ruquier", "Vanessa Paradis_F", "Jeanne Moreau_F", "Robin des bois", "Céline Dion_F", "Paris Hilton_F", "Ayrton Senna", "Louison Bobet", "Bob Beamon", "William Shakespeare", "Nina Hagen_F", "Pierre Richard", "Mary Poppins_F", "Belzébuth", "Joey Starr", "Caliméro", "Michel Galabru", "Steve Austin", "Luke Skywalker", "Mister Bean", "Tarzan", "Carl Lewis", "Martina Navratilova_F", "Kad Merad", "Benoît XVI", "John Keats", "Patrick Poivre d'Arvor", "Akira Kurosawa", "David Hasseloff", "Horst Tapper", "Gérard Majax", "Albert Cohen", "Charlie Chaplin", "Mireille Mathieu_F", "Eva Longoria_F", "Paul Verhoeven", "Nick Cave", "Jean-Louis Trintignant", "Jean-Pierre Marielle", "Homère", "Sophie Davant_F", "Yves Calvi", "Jacques Attali", "Jacques Mesrine", "Charles Manson", "Hugues Aufray", "l'abbé Pierre", "la vierge Marie_F", "Bernard Menez", "Christine Ockrent_F", "Anne Sinclair_F", "Gérard Depardieu", "Dick Rivers", "Linda de Souza_F", "Paul Mac Cartney", "Diana Ross_F", "Mick Jagger", "Marine Le Pen_F", "Marion Maréchal Le Pen_F", "Philippe De Villiers", "Serge Dassault", "Groquick", "Philippe Bouvard", "Coco Channel_F", "Cheb Khaled", "Mohammed VI", "Marcus Garvey", "Eddie Mitchell", "Michel Blanc", "Gérard Jugnot", "Harry Roselmack", "Harry Potter", "Louis XVI", "Rika Zaraï_F", "Jean-Marie Messier", "Pascal Obispo", "Monsieur Spok", "Gollum", "Danny Boon", "John Lennon", "Freddie Mercury", "Nelson Mandella", "Mikhaïl Gorbatchev", "Léon Trotsky", "Gilles Deleuze", "Christophe Colomb", "Michel-Ange", "John F. Kennedy", "Vincent Van Gogh", "Isaac Newton", "Cléopâtre_F", "Tom Cruise", "Aristote", "Blaise Pascal", "René Descartes", "Harrisson Ford", "Jack Nicholson", "Eddie Murphy", "Sean Penn", "Sean Connery", "Ray Charles", "Julia Roberts_F", "Pamela Anderson_F", "Fred Astaire", "Humphrey Bogart", "Robert Mitchum", "Laurent Fabius", "Dominique Strauss-Kahn", "Miles Davis", "Simone De Beauvoir_F", "Margaret Thatcher_F", "Lio_F", "Klaus Barbie", "Maurice Papon", "Jean Jaurès", "Bozo le clown", "Jean Sarkozy", "Sacha Distel", "Robert Smith", "Al Pacino", "Bree Van De Kamp_F", "Marge Simpson_F", "Homer Simpson", "Camille Claudel_F", "George Sand_F", "Emma Bovary_F", "Uma Thurman_F", "la Belle au Bois Dormant_F", "Dorothée_F", "Marion Cotillard_F", "Emmanuelle Béart_F", "Dalida_F", "Nathalie Baye_F", "Claude François", "Denise Fabre_F", "Lara Croft_F", "Carrie Bradshaw_F", "Vampirella_F", "Farah Fawcett_F", "Yvette Horner_F", "Marie-José Perec_F", "Laurence Ferrari_F", "Victoria Silvstedt_F", "Wonder Woman_F", "la princesse Leïa_F", "Soeur Emmanuelle_F", "Valérie Lemercier_F", "Mimie Mathy_F", "Shaquille O'Neal", "Yma Sumac_F", "Rita Hayworth_F", "Laurence Parisot_F", "Michael Moore", "George Michael", "Tex Avery", "le capitaine Haddock", "le commandant Cousteau", "le sous-commandant Marcos", "le sergent Garcia", "le maréchal Pétain", "le général De Gaulle", "Xavier Bertrand", "Philippe Risoli", "Fernandel", "Jean-Paul Belmondo", "Miou-Miou_F", "Hannibal Lecter", "la reine d'Angleterre_F", "le Dalaï-Lama", "le Yéti", "Mike Brant", "Angelica Houston_F", "Whitney Houston_F", "Jean Carmet", "Edouard Balladur", "Marguerite Duras_F", "le capitaine Némo", "Raspoutine", "Elvis Presley", "Jean-Pierre Daroussin", "Silvester Stallone", "le Grand Schtroumph", "la Schtroumphette_F", "Marlene Dietrich_F", "Alice Sapritch_F", "Claude Piéplu", "Bernard Pivot", "le professeur Choron", "Frédéric Mitterand", "Dario Moreno", "Luis Mariano", "Richard Anconina", "Michel Boujenah", "Florence Foresti_F", "Muriel Robin_F", "Michèle Laroque_F", "Bilbo le hobbit", "Garry Kasparov", "Sarah Palin_F", "Carlos", "le juge Burgaud", "Pancho Villa", "Rosa Luxembourg_F", "D'Artagnan", "Omar Bongo", "Mouammar Kadhafi", "Gamal Abdel Nasser", "le maréchal Tito", "Radovan Karadzic", "Simone Veil_F", "Edith Cresson_F", "Euclide", "Pythagore", "Montesquieu", "le cardinal de Richelieu", "le père Fouettard", "Saint-Nicolas", "Saint-Louis", "l'apôtre Pierre", "Bernard Werber", "Peter Jackson", "Peter Pan", "Tom Jones", "Chewbacca", "Colbert", "Jean de la Fontaine", "Helmut Kohl", "Boris Eltsine", "Jacques Brel", "Edith Piaf_F", "Cendrillon_F", "Hildegarde Von Bingen_F", "Catherine de Médicis_F", "Guillaume Tell", "Michel Sardou", "Jackie Sardou_F", "Geneviève de Fontenay_F", "Mathilda May_F", "Bernadette Laffont_F", "Alexandre le Grand", "Etienne Mougeotte", "Flash Gordon", "Catherine Jacob_F", "Emma Thompson_F", "Carmen Maura_F", "Tiger Woods", "Jack Palance", "Kurt Cobain", "Courtney Love_F", "Robert Wadlow", "Henri IV", "François 1er", "Goldorak", "le général Franco", "Arno Klarsfeld", "Luc Ferry", "Rama Yade_F", "Fadela Amara_F", "Faye Dunaway_F", "Charles Bukowski", "Garfield", "Lee \"Scratch\" Perry", "Charlton Heston", "Henry Fonda", "Jane Fonda_F", "Jean-Pierre Papin", "Steffi Graf_F", "Alf", "Orson Welles", "Robinson Crusoë", "Pierre Bellemare", "Léon Zitrone", "Guy Lux", "Marie-Christine Barrault_F", "Romy Schneider_F", "Simone Signoret_F", "Isabelle Adjani_F", "Roger Hanin", "Laetitia Casta_F", "Grace Jones_F", "Macy Gray_F", "Alain Minc", "Claude Rich", "Jean Rochefort", "Salvador Allende", "Emiliano Zapata", "Vercingétorix", "Jacques Delors", "Martine Aubry_F", "Noël Mamère", "Dominique Voynet_F", "Philippe Sollers", "Elisabeth Badinter_F", "Anne Roumanov_F", "Mary Shelley_F", "Armande Altaï_F", "Nicoletta_F", "la Lorelei_F", "Stéphane Guillon", "Chantal Lauby_F", "Beyonce Knowles_F", "Dan Simmons", "Isaac Asimov", "J.R.R. Tolkien", "Hermann Göring", "Monsieur Phelbs", "Alexandre Astier", "Jean Dujardin", "Bruno Salomone", "Circé la magicienne_F", "Madame Soleil_F", "Paco Rabanne", "Guy Bedos", "George Gershwin", "le professeur Tournesol", "Rudyard Kipling", "Nicolas Demorand", "Alain Madelin", "Joann Sfar", "Pinocchio", "Pierre Bourdieu", "Paul Anka", "Ziggy Stardust", "Michèle Obama_F", "Claudia Cardinale_F", "Michèle Alliot-Marie_F", "Daniel Guichard", "Pierre Bachelet", "Sherlock Holmes", "Kenneth Branagh", "Charles Baudelaire", "Lou Ferrigno", "François Hadji-Lazaro", "Ken Loach", "Aimé Césaire", "William Leymergie", "Leonardo Dicaprio", "Landru", "Pocahontas_F", "Michaël Youn", "Richard Gere", "Charles Ingalls", "Laura Ingalls_F", "Madame Olson_F", "Hannah Montana_F", "Calamity Jane_F", "Jackie Brown_F", "Condoleezza Rice_F", "Jeanne Mas_F", "David Copperfield", "Angelina Jolie_F", "André Citroën", "Barbara Bush_F", "Vil Coyote", "Nosferatu", "Terence Hill", "Sergio Leone", "Eli Wallach", "Ursula Andress_F", "Shéhérazade_F", "Brigitte Fontaine_F", "DJ Krush", "MC Hammer", "Rutger Hauer", "Melanie Griffith_F", "John Cleese", "Calvin Klein", "Giorgio Armani", "Eric Naulleau", "Didier Porte", "Ella Fitzgerald_F", "Dinah Washington_F", "Saint-Anselme", "Jean-Claude Bourret", "le commissaire Maigret", "l'ayatollah Khomeni", "Evo Morales", "Florent Pagny", "Gisèle Halimi_F", "Christine Bravo_F", "Isabelle Giordano_F", "Zorah \"la rousse\"_F", "Erik Satie", "Michael Douglas", "Kirk Douglas", "Jacques Chancel", "Christian Estrosi", "le professeur Rollin", "Hannibal Smith", "Luis Rego", "Daniel Auteuil", "Coco l'asticot", "Ernest-Antoine Seillière", "Nicole Notat_F", "Michael Keaton", "Buster Keaton", "Jean-Louis Borloo", "François Bayrou", "Casper le fantôme", "Barbe-Bleue", "le Petit Poucet", "Jennifer Lopez_F", "Lady Gaga_F", "Eric Woerth", "Liliane Bettencourt_F", "Nadine Morano_F", "Françoise Dolto_F", "Françoise Sagan_F", "Eric Cartman", "Jeannie Longo_F", "Claudia Schiffer_F", "Naomi Campbell_F", "Cindy Crawford_F", "Linda Evangelista_F", "Valérie Pécresse_F", "le Petit Chaperon Rouge_F", "Anny Duperey_F", "Don Quichotte", "François Baroin", "Thierry Lhermitte", "Thierry la Fronde", "Michael Schumacher", "Bruno Cremer", "Zabou Breitman_F", "Clark Gable", "Nostradamus", "Brigitte Bardot_F", "Catherine Deneuve_F", "Julie Delpy_F", "Hélène De Fougerolles_F", "Cécile De France_F", "France Gall_F", "Mata Hari_F", "Yolande Moreau_F", "la comtesse De Ségur_F", "la comtesse Bathory_F", "Antoine De Saint-Exupéry", "Charlie Oleg", "François Morel", "Gérald Dahan", "Pline l'ancien", "l'ange Gabriel", "Vénus_F"],
		variantesNP: ["le petit frère de $@3", "la soeur de $@3", "un ami de $@3", "la meilleure amie de $F@3", "un lointain parent de $@3", "l'ennemi juré de $@3", "le coiffeur de $@3", "la famille de $@3", "le sosie de $@3", "le club des admirateurs de $@3", "la grand-mère de $@3", "le beau-frère de $@3", "l'assassin de $@3", "$ en personne@3", "$ et ses avocats@6", "un étrange individu à mi-chemin entre $M et $M@3", "un étrange individu à mi-chemin entre $F et $F@3", "$ et quelques amis@6", "un détraqué prétendant être la réincarnation de $M@3", "le maître à penser de $@3", "$ et $@6", "le réalisateur du film \"$ contre $\"@3", "ceux qui préfèrent $ à $@6", "le fils caché de $@3", "le psychanalyste de $@3", "une groupie de $M@3", "l'enfant adoptif de $ et de $@3", "une femme évoquant l'esprit de $F dans le corps de $F@3", "un homme évoquant l'esprit de $M dans le corps de $M@3", "le premier amour de $@3", "$M et toute sa clique@6", "$ et sa famille@6", "l'attaché de presse de $@3", "l'éditeur des oeuvres complètes de $@3", "le seul ami de $M@3", "la maman de $@3", "le meilleur joueur d'échecs depuis $@3", "une créature de rêve avec la voix de $ et les cheveux de $@3", "le plus mauvais karatéka depuis $@3", "l'homme qui a sauvé la vie de $@3", "$M et son inséparable complice $M@6", "$ et moi@4", "$ et toi@5", "tous les amis d'enfance de $@6", "l'arbitre du match \"$M contre $M\"@3", "tout le monde sauf $@3", "$ au sommet de sa forme@3", "$, $ et moi@4", "$, $ et toi@5", "$, $, et même $@6", "quelqu'un qui ressemble à $@3", "la doublure de $@3", "$F en petite tenue@3", "la parodie gothique de $@3", "le mari de $F@3", "la femme de $M@3", "le premier petit ami de $F@3", "un couple aussi bien assorti que $F et $M@3", "le voisin de palier de $@3", "$ se prenant pour $@3", "l'auteur du livre \"Ma vie avec $\"@3", "la baby-sitter de $@3", "un certain \"$M\"@3", "une certaine \"$F\"@3", "tous les ancêtres de $@6", "tous les descendants de $@6", "$M déguisé en $@3", "$F déguisée en $@3", "$M (malheureusement accompagné de $)@3", "$F (malheureusement accompagnée de $)@3", "$ complètement ivre@3", "$M et $F la main dans la main@6", "$ portant $ sur son dos@3", "le psychanaliste de $@3", "le fantôme de $@3", "le chat de $@3", "quelqu'un qui déteste $@3", "tous les participants du mariage de $M et $F@6", "les enfants de $F et $M@6", "un barman ayant bien connu $@3", "la sage-femme qui a mis au monde $@3", "le partenaire de bridge de $@3", "une strip-teaseuse encore plus torride que $F@3", "un lutteur aussi imposant que $M@3", "$M et son bras droit $M@6", "$F et son assistante $F@6", "une femme moins belle que $F@3", "un homme moins grand que $M@3", "un monstre sorti des cauchemars de $@3", "la dernière personne ayant parlé à $@3", "l'équipe de choc formée par $ et $@3", "le contact de $ dans la Mafia@3", "le fils spirituel de $M@3"],
		compter: function () {
			var resultat = 0;
			var NOMBRE = 2;

			var articles = 3;// définis, indéfinis et démonstratifs : une seule possibilité pour chaque (cause règles accord)
			var nombres = 1090;// nombres de nombres possibles comme article (tous ceux de 2 à 1000, puis de 100 en 100 jusqu'à 10000)
			var quantifieurs = Generateur.Articles.quantifieurs.length + 99;// pour le cas du pourcentage (%%)
			articles += nombres + quantifieurs;

			var complements = Generateur.GN.complementNomPost.length + 1;
			var jokersC = 0;
			for (var i = 0, iMax = Generateur.GN.complementNomPost.length; i < iMax; ++i) {
				var compl = Generateur.GN.complementNomPost[i];
				for (var j = 0, jMax = compl.length; j < jMax; ++j) {
					if (compl.charAt(j) == "&") {
						++jokersC;
					}
				}
			}
			complements += (jokersC * 100);

			// noms communs
			for (var i = 0, iMax = Generateur.GN.nomsCommuns.length; i < iMax; ++i) {
				var nom = Generateur.GN.nomsCommuns[i];
				var genre = ((/[%N]/).test(nom)) ? 2 : 1;

				resultat += (genre * NOMBRE * articles * complements);
			}

			// pronoms personnels
			resultat += 6;

			// noms propres simples
			var totalNP = Generateur.GN.nomsPropres.length;
			resultat += totalNP;

			// variantes des noms propres
			var jokers = 0;
			for (var i = 0, iMax = Generateur.GN.variantesNP.length; i < iMax; ++i) {
				var nomP = Generateur.GN.variantesNP[i];
				for (var j = 0, jMax = nomP.length; j < jMax; ++j) {
					if (nomP.charAt(j) == "$") {
						++jokers;
					}
				}
			}
			resultat += (jokers * totalNP);

			return resultat;
		}
	},

	groupeNominal: function (estObjet) {
		if (de(5) > 4) {
			if (de(2) > 1) {
				var variante;
				do {
					variante = Generateur.GN.variantesNP.puiser();
				} while (estObjet && (/ et (moi|toi|nous|vous)/).test(variante));
				var posDollar = variante.indexOf("$");
				while (posDollar > -1) {
					var chercheF = variante.charAt(posDollar + 1) == "F";
					var chercheM = variante.charAt(posDollar + 1) == "M";
					var nomP;
					do {
						var fem;
						do {
							nomP = Generateur.GN.nomsPropres.puiser();
							fem = nomP.indexOf("_F") > -1;
						} while ((chercheM && fem) || (chercheF && !fem));
						nomP = nomP.replace(/_F/, "");
					} while (variante.indexOf(nomP) > -1);
					variante = variante.replace(/\$[FM]?/, nomP);
					posDollar = variante.indexOf("$");
				}
				return variante.replace(/ (d|qu)e ([aeiouhéêèây])/gi, " $1'$2");
			}
			return Generateur.GN.nomsPropres.puiser().replace(/\_F/, "") + "@3";
		}
		if (!estObjet && (de(10) > 7)) {
			pronomP = probaSwitch(Generateur.GN.pronomsPers, Generateur.GN.PROBA_PRONOMS_PERS);
			if (pronomP.indexOf("_") == -1) {
				return pronomP;
			}
			var personne = pronomP.split("@")[1];
			pronomP = pronomP.split("@")[0].split("_");
			return pronomP[((de(2) > 1) ? 0 : 1)] + "@" + personne;
		}
		// --- noms communs ---
		var nom = Generateur.GN.nomsCommuns.puiser();
		if (nom.indexOf("%") > -1) {
			nom = nom.split("%");
			if (nom[1].length == 1) {
				nom[1] = nom[0].replace(/².*$/, "") + nom[1];
			}
			nom[0] += "_H";
			nom[1] += "_F";
			nom = nom.puiser();
		}
		nom = nom.split("_");
		if ((nom[1] == "N") && (de(2) > 1)) {
			nom[1] = "F";
		}

		var feminin = nom[1] == "F";
		nom = nom[0];
		var pluriel = de(2) == 1;
		var voyelle = nom.voyelle();

		var article, jetArticle = de(100);
		if (jetArticle < 38) { // définis
			article = Generateur.Articles.articlesDef[(pluriel) ? 1 : 0];
		} else if (jetArticle < 78) { // indéfinis
			article = Generateur.Articles.articlesIndef[(pluriel) ? 1 : 0];
		} else if (jetArticle < 84) { // démonstratifs
			article = Generateur.Articles.articlesDemo[(pluriel) ? 1 : 0];
		} else if (jetArticle < 96) { // quantifieurs
			article = probaSwitch(Generateur.Articles.quantifieurs, Generateur.Articles.PROBA_QUANTIFIEURS);
			pluriel = article.indexOf("µ") == -1;
			if (article.indexOf("%%") > -1) {
				article = article.replace(/%%/, de(100).enLettres());
			}
		} else { // nombres entiers
			var nombre = deProgressif_1();
			article = nombre.enLettres();
			if (feminin) {
				article = article.replace(/un$/, "une");
			}
			pluriel = true;
		}

		if (article.indexOf("_") > -1) {
			article = article.split("_")[(feminin) ? 1 : 0];
		}

		var plurielNom = (article.indexOf("µ") > -1) ? true : pluriel;
		article = article.replace(/µ/, "");
		nom = Generateur.accordPluriel(nom, plurielNom);

		var complement = "";
		if (de(4) > 3) {
			complement = Generateur.GN.complementNomPost.puiser();
			if (complement.indexOf("%") > -1) {
				complement = complement.split("%");
				if (complement[1].length == 1) {
					complement[1] = complement[0] + complement[1];
				}
				complement = complement[(feminin) ? 1 : 0];
			}
			complement = " " + Generateur.accordPluriel(complement, plurielNom);
			var nombre;
			while (complement.indexOf("&") > -1) {
				nombre = (de(100) + 1).enLettres();
				if (feminin && (/un$/.test(nombre))) {
					nombre += "e";
				}
				complement = complement.replace(/&/, nombre);
			}
		}

		var groupeN = article + " " + nom + complement;
		if (voyelle) {
			groupeN = groupeN.replace(/.\* /, "'").replace(/€/, "t");
		}
		groupeN = groupeN.replace(/[\*€]/g, "");
		var codePers = "";
		if (!estObjet) {
			codePers = "@" + ((pluriel) ? "6" : "3");
		}
		return groupeN + codePers;
	},

	CO: {
		nomsCommuns: ["armoire_F", "boulet_H", "bouteille²s de coca_F", "ornithorynque_H", "spatule_F", "machin_H", "truc_H", "objet_H", "chose_F", "crêpe²s fourrée²s_F", "cagoule_F", "strapontin_H", "table_F", "chaise_F", "lampe_F", "crayon²s de papier_H", "boule²s à facettes_F", "ordinateur_H", "planche²s à voile_F", "poutrelle²s de chantier_F", "cheeseburger_H", "paire²s de lunettes_F", "camion_H", "voiture_F", "club²s de golf_H", "moissonneuse²s-batteuse²s_F", "pastèque_F", "barrage²s hydro-électrique²s_H", "secret_H", "idée_F", "victoire_F", "massacre_H", "surprise_F", "outil_H", "spectre_H", "déception_F", "spectacle_H", "fête_F", "bijou²x_H", "cigarette_F", "hippopotame_H", "pelle²s à tarte_F", "télévision_F", "fruit_H", "résultat_H", "paire²s de santiags_F", "moule²s à gauffres_H", "sèche-cheveux²_H", "scaphandre²s de plongée_H", "trophée_H", "récompense_F", "punition_F", "objectif_H", "couteau²x de cuisine_H", "appareil²s photo_H", "déguisement_H", "jouet_H", "jeu²x_H", "baleine_F", "vautour_H", "ver²s de terre_H", "arme²s à feu_F", "imprimante_F", "texte_H", "livre_H", "chiffre_H", "dessin_H", "mélodie_F", "conversation_F", "légume_H", "ballon²s de foot_H", "soutien-gorge²_H", "escalator_H", "hélicoptère_H", "mot_H", "phrase_F", "bruit_H", "mélange_H", "oiseau²x_H", "poisson_H", "sac²s de charbon de bois_H", "poubelle_F", "arbre_H", "cube_H", "sphère_F", "pyramide_F", "boule²s de cristal_F", "corde_F", "chaîne_F", "boîte_F", "sac_H", "râteau²x_H", "bombe_F", "bouteille_F", "carton_H", "barricade_F", "mur_H", "porte²s de £angar_F", "gadget_H", "tapis²_H", "moto_F", "bicyclette_F", "bougie_F", "bâton_H", "récipient_H", "structure_F", "nature_F", "culture_F", "doctrine_F", "religion_F", "recette²s de cuisine_F", "£ibou²x_H", "serpent_H", "éléphant_H", "pomme_F", "masse_F", "raison_F", "cause_F", "effet_H", "relation_F", "action_F", "passion_F", "qualité_F", "désastre_H", "événement_H", "fait_H", "cliché_H", "photo_F", "film_H", "album²s de bande dessinée_H", "drapeau²x_H", "journal²²journaux_H", "cadavre_H", "douleur_F", "blessure_F", "carte_F", "cheval²²chevaux_H", "cheveu²x_H", "molécule_F", "planète_F", "astre_H", "engin_H", "machine_F", "train_H", "avion_H", "clef²s USB_F", "clef_F", "vêtement_H", "aliment_H", "origine_F", "état_H", "procédé_H", "manoeuvre_F", "stratégie_F", "émotion_F", "sentiment_H", "histoire_F", "mensonge_H", "regard_H", "valeur_F", "fonction_F", "métier_H", "ressource_F", "produit_H", "oeuvre_F", "acte_H", "volonté_F", "décision_F", "déclaration_F", "médicament_H", "remède_H", "maladie_F", "épidémie_F", "accident_H", "incident_H", "chanson_F", "air_H", "lettre_F", "support_H", "question_F", "réponse_F", "ordre_H", "loi_F", "contrat_H", "poison_H", "collier_H", "erreur_F", "faute_F", "route_F", "chemin_H", "image_F", "son_H", "couleur_F", "odeur_F", "sensation_F", "pouvoir_H", "chapeau²x_H", "modèle_H", "copie_F", "caprice_H", "miroir_H", "bilan_H", "épave_F", "fossile_H", "défaite_F", "ectoplasme_H", "neurone_H", "symbole_H", "gaz²_H", "liquide_H", "pâte_F", "mixture_F", "vision_F", "projet_H", "aiguille_F", "sanction_F", "geste_H", "posture_F", "rôle_H", "harmonie_F", "dissonance_F", "lumière_F", "rayon_H", "tube_H", "tuyau²x_H", "cactus²_H", "champignon_H", "moisissure_F", "buisson_H", "feuille_F", "piste_F", "zone_F", "alarme_F", "coffre_H", "centre_H", "milieu²x_H", "extrémité_F", "sommet_H", "gouffre_H", "membre_H", "organe_H", "défi_H", "signal²²signaux_H", "gâteau²x_H", "espace_H", "matière_F", "matériau²x_H", "plan_H", "moment_H", "siècle_H", "heure_F", "sens²_H", "direction_F", "forme_F", "essence_F", "langue_F", "langage_H", "registre_H", "flux²_H", "beignet_H", "croquette²s pour chats_F", "usine_F", "virus²_H", "plumeau²x_H", "mouche_F", "bonbon_H", "mitrailleuse_F", "spirale_F", "costume_H", "note²s de musique_F", "lavabo_H", "boisson_F", "cacahuète_F", "océan_H", "apparition_F", "casserole_F", "coeur_H", "noyau²x_H", "tige_F", "oreiller_H", "dent_F", "main_F", "silence_H", "cerveau²x_H", "cachet²s d'aspirine_H", "écran_H", "clavier_H", "vélo_H", "animal²²animaux_H", "sujet_H", "dossier_H", "fichier_H", "programme_H", "base²s de données_F", "poupée_F", "statue_F", "intention_F", "planche_F", "reflet_H", "goutte²s d'eau_F", "litre²s de pétrole_H", "machine-outil²²machines-outils_F", "piano_H", "guitare_F", "amour_H", "amitié_F", "droit_H", "limite_F", "illusion_F", "hologramme_H", "véhicule_H", "moyen²s de transport_H", "instrument²s de musique_H", "instrument²s de mesure_H", "moteur_H", "pièce_F", "pomme²s de terre_F", "câble_H", "fil_H", "cadeau²x_H", "jugement_H", "linceul_H", "radeau²x_H", "bateau²x_H", "château²x de sable_H", "épi²s de maïs_H", "solution_F", "problème_H", "tabou_H", "crime_H", "£aricot_H", "possibilité_F_H", "situation_F", "cercueil_H", "radar_H", "thon_H", "belette_F", "coq_H", "autruche_F", "panier_H", "clou_H", "putois²_H", "glace_F", "tableau²x_H", "lapin_H", "banane_F", "grenade_F", "clochette_F", "trampoline_H", "bilboquet_H", "crécelle_F", "issue_F", "lampe²s de poche_F", "paupière_F", "oeil²²yeux_H", "corps²_H", "esprit_H", "âme_F", "épaule_F", "bras²_H", "jambe_F", "tête_F", "os²_H", "conscience_F", "vacarme_H", "activité_F", "catastrophe_F", "lieu_H", "endroit_H", "instant_H", "période_F", "maison_F", "colibri_H", "hippocampe_H", "caméléon_H", "araignée_F", "chien_H", "chat_H", "morse_H", "amibe_F", "vache_F", "ragondin_H", "koala_H", "mangue_F", "poire_F", "grappe²s de raisin_F", "logiciel_H", "gigot_H", "bille_F", "scalpel_H", "esquisse_F", "croquis²_H", "enclume_F", "briquet_H", "plume_F", "bouteille²s de gaz_F", "arbalète_F", "masque²s de plongée_H", "indice_H", "représentation_F", "présentation_F", "distribution_F", "proposition_F", "ambiance_F", "galette_F", "cachet_H", "cachette_F", "rubrique_F", "brique_F", "police_F", "association²s de malfaiteurs_F", "cachalot_H", "coussin_H", "tronçonneuse_F", "saxophone_H", "cloche_F", "interdiction_F", "hôpital²²hôpitaux_H", "accessoire_H", "gauffrette_F", "massicot_H", "asticot_H", "toboggan_H", "réacteur_H", "ingrédient_H", "épice_F", "flamme_F", "bulle_F", "escabeau²x_H", "mirador_H", "ouvre-boîte_H", "oreille_F", "nez²_H", "tentacule_H", "poulpe_H", "astéroïde_H", "montre_F", "missile_H", "zébu_H", "opération_F", "opéra_H", "bretelle_F", "calice_H", "coquelicot_H", "tulipe_F", "rose_F", "souci_H", "paire²s de ciseaux_F", "silo_H", "globule_H", "globe_H", "rocher_H", "tronc²s d'arbre²s_H", "catapulte_F", "steack²s d'autruche_H", "bison_H", "caméra_F", "décoration_F", "gloire_F", "£onte_F", "paquet_H", "oeuf_H", "flaque²s d'eau_F", "station²s orbitale²s_F", "wagon_H", "téléphone_H", "fax²_H", "chance_F", "silhouette_F", "citrouille_F", "aubergine_F", "poireau²x_H", "patate_F", "pipe_F", "piment_H", "caddie_H", "trompette_F", "bulldozer_H", "escargot_H", "crachat_H", "combinaison_F", "calcul_H", "transaction_F", "échange_H", "pillage_H", "combat_H", "tuile_F", "barbe²s à papa_F", "stock_H", "compte_H", "compteur_H", "kaléïdoscope_H", "bidon_H", "accordéon_H", "robot_H", "saucisson_H", "ventouse_F", "seringue_F", "disque²s dur²s_H", "disque_H", "format_H", "gabarit_H", "absence_F", "imbécilité_F", "connerie_F", "vacherie_F", "saloperie_F", "merde_F", "girafe_F", "ceinture_F", "godasse_F", "flingue_H", "prune_F", "estampe_F", "esturgeon_H", "jour_H", "nuit_F", "cassette_F", "disquette_F", "cartouche_F", "calculatrice_F", "meuble_H", "buffet_H", "gargouille_F", "glyphe_H", "symphonie_F", "galaxie_F", "bouquin_H", "galère_F", "sirop_H", "ressort_H", "poulie_F", "scaphandre_H", "cigare_H", "force_F", "énergie_F", "super-pouvoir_H", "alliance_F", "suc_H", "sucre_H", "sacoche_F", "transistor_H", "tonneau²x_H", "débris²_H", "ruine_F", "cassoulet_H", "lardon_H", "balançoire_F", "ski_H", "tabouret_H", "magouille_F", "délice_H", "tremplin_H", "vis²_F", "marteau²x_H", "isotope_H", "polymère_H", "service_H", "syndicat_H", "mission_F", "course_F", "réflexe_H", "mouvement_H", "reproche_H", "nom_H", "prénom_H", "âge_H", "date_F", "manie_F", "obsession_F", "régime_H", "gouvernement_H", "levier_H", "promesse_F", "abonnement_H", "cordon_H", "dividende_H", "ouragan_H", "sablier_H", "compas²_H", "balance_F", "prix²_H", "redingote_F", "canular_H", "palmipède_H", "pédale_F", "parquet_H", "£ublot_H", "pilori_H", "orgasme_H", "coloquinte_F", "farandole_F", "concile_H", "glaçon_H", "boutique_F", "marchandise_F", "unité_F", "cercle_H", "triangle_H", "rectangle_H", "carré_H", "polygone_H", "pièce²s de monnaie_F", "cure-dents²_H", "chausse-pied_H", "bulbe_H", "tombe_F", "croix²_F", "aile_F", "signe_H", "grimace_F", "boeuf_H", "alambic_H", "postillon_H", "frégate_F", "balcon_H", "cornichon_H", "feu²x_H", "mamelle_F", "exception_F", "parodie_F", "cellule_F", "code_H", "billet²s de banque_H", "mortier_H", "plante_F", "pal_H", "danger_H", "regret_H", "puits²_H", "plate-forme²²plates-formes_F", "contexte_H", "environnement_H", "filière_F", "chant_H", "cri_H", "pizza_F", "retour_H", "merveille_F", "écosystème_H", "supplique_F", "comprimé_H", "caravane_F", "£angar_H", "anniversaire_H", "cérémonie_F", "arc_H", "promenade_F", "ballade_F", "labyrinthe_H", "église_F", "cornet_H", "carte²s de crédit_F", "meurtre_H", "cèdre_H", "fraise_F", "anneau²x_H", "casque_H", "épée_F", "échelle_F", "borne_F", "coup²s de pied_H", "pelle_F", "boulette_F", "bain_H", "bouton_H", "rue_F", "vertu_F", "locomotive_F", "wapiti_H", "chalumeau²x_H", "pulsation_F", "galipette_F", "chique_F", "poil_H", "serrure_F", "carambar_H", "souvenir_H", "conquête_F", "meringue_F", "formulaire_H", "opuscule_H", "stigmate_H", "révélation_F", "pile_F", "lama_H", "épuisette_F", "papillon_H", "filet_H", "chaudière_F", "javelot_H", "navette_F", "diaphragme_H", "minaret_H", "escarcelle_F", "sandalette_F", "vibration_F", "secousse_F", "concept_H", "vitrine_F", "bureau²x_H", "lit_H", "fenêtre_F", "escalier_H", "merdouille_F", "andouillette_F", "gorgée²s de soda_F", "abcès²_H", "procédure_F", "barbichette_F", "cascade_F", "paradis²_H", "rêve_H", "identité_F", "vérité_F", "corne²s de zébu_F", "oeuf²s de poisson_H", "parabole_F", "faribole_F", "estomac_H", "éternuement_H", "tracteur_H", "caramel_H", "imitation_F", "percolateur_H", "synapse_F", "neutron_H", "nuage_H", "pain_H", "griffe²s de tigre_F", "os de baleine²_H", "plume²s de corbeau_F", "mégot_H", "fourchette_F", "échantillon²s de carburant_H", "caricature_F", "omelette²s aux champignons_F", "rapport_H", "fer²s à repasser_H", "fer²s à cheval_H", "formation_F", "information_F", "ecchymose_F", "abricotier_H", "roulotte_F", "tube²s de dentifrice_H", "étagère_F", "mocassin_H", "turbine_F", "module_H", "moufle_F", "galurin_H", "pochette_F", "ananas²_H", "soufflet_H", "insecte_H", "sorbet_H", "tubercule_H", "filet²s de morue_H", "astronef_H", "sac²s de plâtre_H", "outre_F", "vélocipède_H", "tarentule_F", "pédoncule_H", "rat_H", "échiquier_H", "ardoise_F", "addition_F", "bétonneuse_F", "centrifugeuse_F", "sein_H", "sifflet_H", "hélice_F", "sonde_F", "£aricot²s vert²s_H", "carte²s de visite_F", "carburateur_H", "soupape_F", "siphon_H", "soustraction_F", "gourde_F", "ineptie_F", "vignoble_H", "garniture_F", "ornement_H", "ristourne_F", "mélopée_F", "incubateur_H", "produit²s chimique²s_H", "déchet_H", "esquive_F", "réplique_F", "embarcation_F", "patin_H", "gratin²s de choux-fleurs_H", "blanquette²s de veau_F", "casquette_F", "bassin_H", "ampoule_F", "potentiomètre_H", "chariot_H", "vestibule_H", "mélèze_H", "équerre_F", "ellipse_F", "molosse_H", "pathologie_F", "récital_H", "salaire_H", "salade²s de pommes de terre_F", "tartine_F", "gamelle_F", "chantier_H", "violoncelle_H", "oud_H", "loutre_F", "obstacle_H", "ratatouille_F", "caroncule_F", "détonation_F", "déflagration_F", "soliflore_H", "montgolfière_F", "dirigeable_H", "deltaplane_H", "ricochet_H", "souffle_H", "pot²s de miel_H", "faux²_F", "scie_F", "circulaire_F", "poste_H", "accélérateur²s de particules_H", "bonbonne²s de gaz_F", "réticule_H", "stéthoscope_H", "annuaire_H", "hameçon_H", "écrou_H", "vielle_F", "poêle²s à frire_F", "guimbarde_F", "palet_H", "palette_F", "palais²_H", "£arnais²_H", "anacoluthe_F", "olivier_H", "tranche²s de lard fumé_F", "dithyrambe_H", "galéjade_F", "élucubration_F", "ritournelle_F", "fatrasie_F", "bidonville_H", "estaminet_H", "crustacé_H", "mollusque_H", "coquillage_H", "armure_F", "compilateur_H", "incendie²s de forêt_H", "innondation_F", "teinte_F", "tenture_F", "attentat_H", "cruche_F", "rayon²s X_H", "tablette_F", "tablier_H", "narine_F", "mandarine_F", "sardine_F", "triton_H", "gemme_F", "chacal_H", "poulet_H", "noix²_F", "noix de coco²_F", "antivol_H", "rétroviseur_H", "sac²s à main_H", "pot_H", "saucisse_F", "brosse²s à dents_F", "balai_H", "huître_F", "sac²s à dos_H", "rainure_F", "oscilloscope_H", "corbeille_F", "ponction_F", "gîte_H", "phare_H", "loupe_F", "chaloupe_F", "ascenseur_H", "sabot_H", "pneu_H", "garantie_F", "oligo-élément_H", "tarte²s aux quetsches_F", "belvédère_H", "ustensile_H", "hérésie_F", "ventre_H", "£anche_F", "plinthe_F", "portemanteau²x_H", "patère_F", "catégorie_F", "inventaire_H", "grain²s de riz_H", "grain²s de sable_H", "miasme_H", "stégosaure_H", "dinosaure_H", "brontosaure_H", "donjon_H", "dragon_H", "mèche_F", "colonne_F", "rang_H", "balle_F", "volcan_H", "glacier_H", "gourmette_F", "couronne_F", "potiche_F", "trident_H", "estampille_F", "sucre²s d'orge_H", "simulacre_H", "court-circuit_H", "décharge_F", "mythe_H", "biniou_H", "péninsule_F", "bibelot_H", "leurre_H", "boutade_F", "guidon_H", "raquette_F", "comptoir_H", "filtre_H", "souhait_H", "révolution_F", "caverne_F", "£allebarde_F", "scandale_H", "île_F", "courgette_F", "calèche_F", "onde_F", "monde_H", "armistice_H", "trognon²s de pomme²s_H", "pays²_H", "continent_H", "fronde_F", "frite_F", "capuchon_H", "couvercle_H", "version_F", "aversion_F", "conversion_F", "diversion_F", "sélection_F", "friandise_F", "pont_H", "porte_F", "affiche_F", "foulard_H", "fouet_H", "mouton_H", "brebis²_F", "fromage²s de brebis_H", "fromage_H", "pot²s de fromage blanc_H", "pardessus²_H", "£alo_H", "tignasse_F", "pantalon_H", "froc_H", "tracas²_H", "bagarre_F", "brin²s de muguet_H", "cadre_H", "canoë_H", "clef²s à molette_F", "corpuscule_H", "marécage_H", "itinéraire_H", "kimono_H", "kiwi_H", "imperméable_H", "liste_F", "fétu²s de paille_H", "façade_F", "face_F", "bouc_H", "bouche_F", "nid_H", "nid²s de guêpes_H", "frelon_H", "firme_F", "étui_H", "étiquette_F", "agrafeuse_F", "ville_F", "tunnel_H", "visage_H", "tesson²s de bouteille_H", "tiroir_H", "poussette_F", "landau_H", "tringle²s à rideaux_F", "épicerie_F", "reptile_H", "impression_F", "dépression_F", "pression_F", "suppression_F", "carnage_H", "obus²_H", "guirlande_F", "stratagème_H", "accent_H", "apostrophe_F", "barbe_F", "brin²s d'herbe_H", "pas²_H", "figure_F", "parenthèse_F", "point_H", "pointe_F", "trait_H", "trait²s d'union_H", "tortue_F", "schéma_H", "étalon_H", "baraque_F", "coin_H", "destination_F", "pré_H", "bal_H", "cour_F", "courbe_F", "carapace_F", "caleçon_H", "classe_F", "paquebot_H", "particule_F", "partie_F", "parapluie_H", "asperge_F", "agrume_H", "têtard_H", "tour_H", "tour_F", "tourbillon_H", "tourniquet_H", "tourte_F", "arabesque_F", "larve_F", "larme_F", "sapin²s de noël_H", "semaine_F", "style_H", "substance_F", "équation_F", "éclair_H", "éclat²s d'obus_H", "yourte_F", "yaourt_H", "xylophone_H", "veste_F", "tétine_F", "trou_H", "tournevis²_H", "surface_F", "année_F", "archipel_H", "crampon_H", "cortège_H", "cor_H", "col_H", "cinéma_H", "ciel_H", "cil_H", "archive_F", "astérisque_H", "atoll_H", "attribut_H", "bar_H", "barre²s de céréales_F", "barre_F", "barre²s de fer_F", "biberon_H", "bise_F", "bon²s de réduction_H", "boucle²s d'oreille_F", "brise_F", "cabane_F", "chateau²x", "case_F", "camp²s de vacances_H", "piège²s à cons_H", "mer_F", "mine_F", "mise_F", "misère_F", "mois²_H", "mûre_F", "mule_F", "muse_F", "musée_H", "musette_F", "musaraigne_F", "natte_F", "navet_H", "navire_H", "nappe_F", "nombre_H", "notion_F", "obélisque_H", "oubliette_F", "orifice_H", "orage_H", "omoplate_F", "ombre_F", "ode_F", "ours²_H", "observatoire_H", "platane_H", "pomme²s de pin_F", "poutre_F", "promotion_F", "propriété_F", "revêtement_H", "ravin_H", "quai_H", "quille_F", "questionnaire_H", "querelle_F", "quantité_F", "quignon²s de pain_H", "crédit_H", "croyance_F", "cristal²²cristaux_H", "quête_F", "débit_H", "dictionnaire_H", "dicton_H", "dictature_F", "différence_F", "doigt_H", "décollage_H", "démarrage_H", "fable_F", "faculté_F", "farce_F", "fesse_F", "foyer_H", "fémur_H", "tibia_H", "crâne_H", "fétiche_H", "£utte_F", "grimoire_H", "gomme_F", "kiosque_H", "kilt_H", "képi_H", "kangourou_H", "klaxon_H", "lac_H", "laboratoire_H", "maquette_F", "lien_H", "ligne_F", "licorne_F", "légion_F", "lentille_F", "fonte_F", "citron_H", "liane_F", "boîte²s de nuit_F", "boîte²s de conserve_F", "béquille_F", "fauteuil_H", "front_H", "abri_H", "académie_F", "altimètre_H", "allumette_F", "arête_F", "arrêt²s de bus_H", "aéroport_H", "bracelet_H", "brochure_F", "brochette_F", "cadenas²_H", "cargo_H", "caractère_H", "caribou_H", "cendrier_H", "champ_H", "char_H", "chaumière_F", "chèvre_F", "chute_F", "chou²x_H", "clarinette_F", "compilateur_H", "complément_H", "compagnie_F", "compilation_F", "comptine_F", "côté_H", "coupe_F", "culte_H", "dolmen_H", "examen_H", "existence_F", "exposition_F", "explosion_F", "exil_H", "exonération_F", "garage_H", "gare_F", "furet_H", "fumée_F", "fuite_F", "funiculaire_H", "frisson_H", "frange_F", "frein_H", "four_H", "fort_H", "imposture_F", "impulsion_F", "institution_F", "instinct_H", "liqueur_F", "lot_H", "lutte_F", "lueur_F", "luciole_F", "luge_F", "mat_H", "matin_H", "mérou_H", "mosquée_F", "moulin_H", "nerf_H", "nervure_F", "nouille_F", "nénuphar_H", "pâte_F", "pâte²s de fruits_F", "patte_F", "perche_F", "photocopie_F", "phallus²_H", "philosophie_F", "pied_H", "pilon_H", "pirouette_F", "plateau²x_H", "poids²_H", "poing_H", "potion_F", "potence_F", "poumon_H", "psaume_H", "pulsion_F", "pêche_F", "péché_H", "rustine_F", "ruse_F", "réveil_H", "sachet_H", "spaghetti_H", "substrat_H", "substitut_H", "tamis²_H", "talon_H", "tarif_H", "tentative_F", "tente_F", "tentation_F", "théière_F", "toge_F", "torgnole_F", "trompe_F", "tuba_H", "voie_F", "voix²_F", "zoo_H", "zèbre_H", "élément_H", "électron_H", "étable_F", "étape_F", "allégorie_F", "don_H", "tendon_H", "mousqueton_H", "café_H", "succès²_H", "drap_H", "alizé_H", "soupir_H", "bide_H", "bidet_H", "évier_H", "accord_H", "record_H", "ampoule_F", "arquebuse_F", "buse_F", "bus²_H", "artère_F", "caisse_F", "canal²²canaux_H", "capital²²capitaux_H", "cargaison_F", "charge_F", "chargement_H", "chassis²_H", "condition_F", "condiment_H", "coude_H", "couverture_F", "cylindre_H", "désert_H", "filon_H", "fissure_F", "faille_F", "crevasse_F", "fluide_H", "engrais²_H", "génération_F", "générateur_H", "forêt_F", "forfait_H", "fourmilière_F", "fourmi_F", "fourneau²x_H", "fournaise_F", "jardin_H", "jambon_H", "jet²s d'eau", "joue_F", "jus²_H", "juridiction_F", "jante_F", "jument_F", "joint_H", "lame_F", "lance_F", "langouste_F", "leçon_F", "licence_F", "ligament_H", "lièvre_H", "lobe_H", "lustre_H", "lunette_F", "lyre_F", "montagne_F", "myrtille_F", "métal²²métaux_H", "oasis²_F", "obligation_F", "occasion_F", "octogone_H", "octave_H", "olive_F", "ogive_F", "ongle_H", "onglet_H", "opale_F", "opportunité_F", "option_F", "papille_F", "phacochère_H", "pin_H", "pingouin_H", "plaine_F", "poussin_H", "port_H", "pupille_F", "pépin_H", "rhinocéros²_H", "rotule_F", "roue_F", "récepteur_H", "reçu_H", "résidu_H", "résidence_F", "statut_H", "torse_H", "torsade_F", "torpille_F", "torchon_H", "trapèze_H", "utopie_F", "usage_H", "urgence_F", "univers²_H", "uniforme_H", "union_F", "ulcère_H", "vaisseau²x_H", "veine_F", "village_H", "barrique_F"],
		adjectifsPost: ["géant%e", "rôti%e", "métallique", "giratoire", "acheté²s à crédit%achetée²s à crédit", "ridicule", "efficace", "inutile", "bleu%e", "rouge", "vert%e", "noir%e", "blanc%blanche", "transparent%e", "malodorant%e", "indestructible", "titanesque", "invisible", "endommagé%e", "bancal%e", "fluorescent%e", "instable", "récurrent%e", "imaginaire", "inespéré%e", "chaud%e", "froid%e", "idéal²²idéaux%idéale", "défectueux²%défectueuse", "historique", "démontable", "téléscopique", "grotesque", "approximatif%approximative", "cruel%cruelle", "décomposé%e", "inventé%e", "sévère", "parfumé%e", "contre-nature²", "normal²²normaux%normale", "absurde", "contradictoire", "liquide", "solide", "gazeux²%gazeuse", "spécial²²spéciaux%spéciale", "bizarre", "catastrophique", "illégal²²illégaux%illégale", "ordinaire", "réglementaire", "musical²²musicaux%musicale", "caché%e", "secret%secrète", "ancien%ancienne", "moderne", "archaïque", "primitif%primitive", "mystique", "essentiel%essentielle", "interdit%e", "parfait%e", "absolu%e", "confortable", "congelé%e", "statique", "dynamique", "permanent%e", "temporaire", "sacré%e", "pneumatique", "hydraulique", "électrique", "réduit%e", "ouvert%e", "fermé%e", "allumé%e", "éteint%e", "fonctionnel%fonctionnelle", "théorique", "pratique", "expérimental²²expérimentaux%expérimentale", "traditionnel%traditionnelle", "dangereux²%dangereuse", "inadapté%e", "régulier%régulière", "chronique", "exceptionnel%exceptionnelle", "tubulaire", "carré%e", "flexible", "mou%molle", "dur%e", "amer%amère", "tragique", "brisé%e", "asynchrone", "métaphorique", "obsolète", "dansant%e", "réel%réelle", "irréel%irréelle", "perdu%e", "exquis²%exquise", "mortel%mortelle", "vital²²vitaux%vitale", "sonore", "lumineux²%lumineuse", "arboricole", "édulcoré%e", "gras²%grasse", "étanche", "équiprobable", "garanti²s à vie%garantie²s à vie", "monté²s sur ressorts%montée²s sur ressorts", "à piles²", "légal²²légaux%légale", "classique", "à roulettes²", "à voiles²", "de carnaval²", "factice", "de cérémonie²", "rituel%rituelle", "tardif%tardive", "précoce", "extraordinaire", "de combat²", "nouveau²x%nouvelle", "thérapeutique", "médical²²médicaux%médicale", "scientifique", "poilu%e", "alimentaire", "élémentaire", "professionnel%professionnelle", "de rechange²", "hypothéqué%e", "artificiel%artificielle", "naturel%naturelle", "préfabriqué%e", "modifié%e", "en mutation²", "radioactif%radioactive", "animé%e", "interne", "externe", "majestueux²%majestueuse", "automatique", "durable", "cohérent%e", "synthétique", "oublié%e", "de collection²", "à vapeur²", "standard²", "virtuel%virtuelle", "vide", "entier%entière", "sinusoïdal²²sinusoïdaux%sinusoïdale", "cocasse", "poreux²%poreuse", "de base²", "improvisé%e", "apprivoisé%e", "de fortune²", "sur mesure²", "d'origine inconnue²", "de compétition²", "en bois²", "en cristal²", "en marbre²", "de l'espace²", "sordide", "vivant%e", "biodégradable", "dégueulasse", "usagé%e", "creux²%creuse", "dodu%e", "multicolore", "complexe", "falsifié%e", "symbolique", "visible", "de secours²", "organique", "mécanique", "physique", "mental²²mentaux%mentale", "cérébral²²cérébraux%cérébrale", "tordu%e", "cru%e", "cuit%e", "ignifugé%e", "disponible", "à répétition²", "superficiel%superficielle", "local²²locaux%locale", "exotique", "générique", "sauvage", "rédhibitoire", "de & mètres d'envergure²", "chauffé²s à & degrés²%chauffée²s à & degrés²", "enterré²s à & mètres de profondeur²%enterrée²s à & mètres de profondeur²", "valant & euros²", "agé²s de & mois²%agée²s de & mois²", "gauche", "droit%e", "mondial²²mondiaux%mondiale", "régional²²régionaux%régionale", "municipal²²municipaux%municipale", "national²²nationaux%nationale", "étranger%étrangère", "en plastique²", "gonflable", "explosif%explosive", "rugueux²%rugueuse", "sélectif%sélective", "définitif%définitive", "imminent%e", "aromatique", "abdominal²²abdominaux%abdominale", "érotique", "à deux sous²", "accessoire", "en vente dans & pays²", "arctique", "de substitution²", "facultatif%facultative", "tropical²²tropicaux%tropicale", "modéré%e", "motorisé%e", "apocalyptique", "en carton²", "à deux vitesses²", "hallal²", "carnivore", "à air comprimé²", "frais²%fraîche", "illusoire", "torsadé%e", "hélicoïdal²²hélicoïdaux%hélicoïdale", "interdit²s aux enfants de moins de & ans%interdite²s aux enfants de moins de & ans", "de & centimètres d'épaisseur²", "à condensation²", "énigmatique", "paradisiaque", "paramilitaire", "entièrement rénové%e", "classé²s \"secret défense\"%classée²s \"secret défense\"", "en forme de courge²", "clouté%e", "en lambeaux²", "hallucinogène", "centrifuge", "partiel%partielle", "fragmentaire", "stellaire", "idéologique", "légèrement phosphorescent%e", "fondamental²²fondamentaux%fondamentale", "décoloré%e", "optique", "escamotable", "comestible", "\"surprise\"²", "partiellement évidé%e", "à la menthe²", "au gingembre²", "nappé²s de chocolat%nappée²s de chocolat", "farci²s aux olives%farcie²s aux olives", "en voie d'extinction²", "ensorcelé%e", "en tranches²", "en poudre²", "portatif%portative", "portable", "glauque", "macabre", "idyllique", "trop salé%e", "en forme de tourte²", "en forme de coeur²", "clignotant%e", "cloné%e", "délicatement manufacturé%e", "chargé²s d'électricité statique%chargée²s d'électricité statique", "périmé²s depuis & mois%périmée²s depuis & mois", "acheté²s en grande surface%achetée²s en grande surface", "préhensile", "opposable", "public%publique", "à vendre²", "farineux²%farineuse", "promotionnel%promotionnelle", "terrifiant%e", "constitué²s de & pièces articulées%constituée²s de & pièces articulées", "circulaire", "sophistiqué%e", "bigarré%e", "surréaliste", "génétiquement modifié%e", "rouillé%e", "décongelé%e", "central²²centraux%centrale", "latéral²²latéraux%latérale", "composé²s de & pour cent d'azote%composée²s de & pour cent d'azote", "totalement insonorisé%e", "caverneux²%caverneuse", "en fonte²", "fatal%e", "mobile"],
		adjectifsPre: ["gros²%grosse", "superbe", "insupportable", "petit%e", "horrible", "grand%e", "autre", "célèbre", "joli%e", "redoutable", "bon%bonne", "vrai%e", "inévitable", "stupide", "glorieux²%glorieuse", "ineffable", "faux²%fausse", "sérieux²%sérieuse", "innocent%e", "précieux²%précieuse", "grave", "beau°bel²²beaux%belle", "énorme", "étrange", "affreux²%affreuse", "ancien%ancienne", "adorable", "long%longue", "impossible", "parfait%e", "doux²%douce", "chaleureux²%chaleureuse", "savoureux²%savoureuse", "excellent%e", "invisible", "éblouissant%e", "sacré%e", "indispensable", "impensable", "£onteux²%£onteuse", "vilain%e", "méchant%e", "gentil%gentille", "sale", "vil%e", "jeune", "vieux°vieil²²vieux%vieille", "simple", "intangible", "magnifique", "rare", "solide", "fragile", "absurde", "sombre", "somptueux²%somptueuse", "coûteux²%coûteuse", "extraordinaire", "nouveau°nouvel²²nouveaux%nouvelle", "court%e", "bref%brève", "dangereux²%dangereuse", "sublime", "splendide", "médiocre", "terrible", "important%e", "léger%e", "tendre", "premier%première", "dernier%dernière", "prochain%e", "quelconque", "triste", "pittoresque", "élégant%e", "sensible", "visible", "hallucinant%e", "rude", "soyeux²%soyeuse", "évident%e", "véritable", "obscur%e", "immonde", "merveilleux²%merveilleuse", "subtil%e", "fameux²%fameuse", "terne", "joyeux²%joyeuse", "douloureux²%douloureuse", "double²²nombreux%double²²nombreuses", "triple²²innombrables"],
		//modificateurs: ["tres", "assez", "trop", "peu"], // chaud a priori ^^'
		// piste : indice en premier caractère genre * et remplacement par un aléatoire de temps en temps
		// >>> uniquement les adjectifs qui se prêtent à une gradation : ex: "très beau" > OK ; "très premier" > NOT OK
		compter: function () {
			var resultat = 0;
			var NOMBRE = 2;
			var articles = 3;// définis, indéfinis et démonstratifs : une seule possibilité pour chaque (cause règles accord)
			articles += 5;// 1 possessif par personne, -1 cas rejeté
			var nombres = 1090;// nombres de nombres possibles comme article (tous ceux de 2 à 1000, puis de 100 en 100 jusqu'à 10000)
			var quantifieurs = Generateur.Articles.quantifieurs.length + 99;// pour le cas du pourcentage (%%)
			articles += nombres + quantifieurs;

			var adjPost = Generateur.CO.adjectifsPost.length;
			var jokers = 0;
			for (var i = 0, iMax = adjPost; i < iMax; ++i) {
				var adj = Generateur.CO.adjectifsPost[i];
				for (var j = 0, jMax = adj.length; j < jMax; ++j) {
					if (adj.charAt(j) == "&") {
						++jokers;
					}
				}
			}
			adjPost += (jokers * nombres);

			var adjPre = Generateur.CO.adjectifsPre.length;
			var adjectifs = (adjPost + adjPre + 1);// +1 pour l'absence d'adjectif



			for (var i = 0, iMax = Generateur.CO.nomsCommuns.length; i < iMax; ++i) {
				var nom = Generateur.CO.nomsCommuns[i];
				var genre = (/[%N]/).test(nom) ? 2 : 1;

				resultat += (genre * NOMBRE * articles * adjectifs);
			}

			return resultat;
		}
	},

	complementObjet: function (personneSujet) {
		var cObj, nom = Generateur.CO.nomsCommuns.puiser();
		var indef = false;
		nom = nom.split("_");
		if ((nom[1] == "N") && (de(2) > 1)) {
			nom[1] = "F";
		}

		var feminin = nom[1] == "F";
		nom = nom[0];
		var pluriel = de(2) == 1;
		var voyelle = nom.voyelle();

		var adjectif = "";
		var prePose = false;
		var jetAdj = de(100);
		if (jetAdj < 20) {
			adjectif = Generateur.CO.adjectifsPost.puiser();
		} else if (jetAdj < 24) {
			adjectif = Generateur.CO.adjectifsPre.puiser();
			prePose = true;
		}
		var noAdj = adjectif.length == 0;

		while (adjectif.indexOf("&") > -1) {
			var nombre = deProgressif_1();
			nombre = nombre.enLettres();
			adjectif = adjectif.replace(/&/, nombre);
		}

		if (!noAdj && (adjectif.indexOf("%") > -1)) {
			adjectif = adjectif.split("%");
			if (adjectif[1].length == 1) {
				adjectif[1] = adjectif[0] + adjectif[1];
			}
			adjectif = adjectif[(feminin) ? 1 : 0];
		}

		var voyelleAdj = false;
		if (!noAdj) {
			voyelleAdj = adjectif.voyelle();
		}

		var article, jetArticle = de(100);
		if (jetArticle < 35) { // définis
			article = Generateur.Articles.articlesDef[(pluriel) ? 1 : 0];
		} else if (jetArticle < 70) { // indéfinis
			article = Generateur.Articles.articlesIndef[(pluriel) ? 1 : 0];
			indef = true;
		} else if (jetArticle < 78) { // démonstratifs
			article = Generateur.Articles.articlesDemo[(pluriel) ? 1 : 0];
		} else if (jetArticle < 90) { // quantifieurs
			article = probaSwitch(Generateur.Articles.quantifieurs, Generateur.Articles.PROBA_QUANTIFIEURS);
			article = article.replace(/µ/, "");
			pluriel = true;
			if (article.indexOf("%%") > -1) {
				article = article.replace(/%%/, de(100).enLettres());
			}
		} else if (jetArticle < 94) { // nombres entiers
			var nombre = deProgressif_1();
			article = nombre.enLettres();
			if (feminin) {
				article = article.replace(/un$/, "une");
			}
			pluriel = true;
		} else { // possessifs
			var personne = 0;
			while (personne == 0) {
				personne = de(6);
				if (Math.abs(personneSujet - personne) == 3) {
					personne = 0;
				}
			}
			article = (pluriel) ? Generateur.Articles.articlesPossP[personne - 1] : Generateur.Articles.articlesPossS[personne - 1];
			if (article.indexOf("_") > -1) {
				var articleFeminin = feminin;
				if ((voyelle && articleFeminin) || (prePose && voyelleAdj)) {
					if (noAdj || (!noAdj && !prePose) || (prePose && voyelleAdj)) {
						articleFeminin = false;
					}
				}
				article = article.split("_")[(articleFeminin) ? 1 : 0];
			}
		}
		if (article.indexOf("_") > -1) {
			article = article.split("_")[(feminin) ? 1 : 0];
		}

		nom = Generateur.accordPluriel(nom, pluriel);
		adjectif = Generateur.accordPluriel(adjectif, pluriel);

		if (prePose && (adjectif.indexOf("°") > -1)) {
			adjectif = adjectif.split("°")[(voyelle) ? 1 : 0];
		}

		if (indef && pluriel && prePose) {
			article = (voyelleAdj) ? "d'" : "de";
		}

		if ((voyelle && noAdj) || (voyelle && !noAdj && !prePose) || (!noAdj && prePose && voyelleAdj)) {
			article = article.replace(/.\* /, "'").replace(/€/, "t");
		}

		if (noAdj) {
			cObj = article + " " + nom;
		} else {
			cObj = article;
			if (!noAdj && prePose) {
				cObj += (article.indexOf("'") == -1) ? (" " + adjectif) : adjectif;
			}
			cObj += " " + nom;
			if (!noAdj && !prePose) {
				cObj += " " + adjectif;
			}
		}

		if ((voyelle && noAdj) || (voyelle && !noAdj && !prePose) || (!noAdj && prePose && voyelleAdj)) {
			cObj = cObj.replace(/.\* /, "'").replace(/€/, "t");
		}
		cObj = cObj.replace(/[\*€]/g, "");
		return cObj;
	},

	accordPluriel: function (mot, pluriel) {
		var retour = mot;
		if (pluriel) {
			if (retour.indexOf("²") == -1) {
				retour += "s";
			} else {
				if (retour.indexOf("²²") == -1) {
					retour = retour.replace(/²([^\s])/g, "$1").replace(/²/g, "");
				} else {
					retour = retour.split("²²")[1];
				}
			}
		} else {
			if (retour.indexOf("²²") > -1) {
				retour = retour.split("²²")[0];
			}
			retour = retour.replace(/²./g, "").replace(/²/g, "");
		}
		return retour;
	},

	stats: function () {
		var tabResultat = [];
		var statsGN = Generateur.GN.compter();
		var statsCO = Generateur.CO.compter();

		var listeST = Grimoire.recupererListe("ST");
		for (var i = 0, iMax = listeST.length; i < iMax; ++i) {
			var resultatStructure = 1;
			var struct = listeST[i];

			for (var j = 0, jMax = struct.length; j < jMax; ++j) {
				var resultatBloc = 0;
				var bloc = struct[j];

				if (bloc.substr(0, 1) == "§") {
					resultatBloc = 1;
				} else
					switch (bloc) {
						case "GN":
							resultatBloc += statsGN;
							resultatBloc += Grimoire.recupererListe(bloc).length;
							break;
						case "CO":
							resultatBloc += statsCO;
							resultatBloc += Grimoire.recupererListe(bloc).length;
							break;
						case "CT":
							var jokers = 0;
							var liste = Grimoire.recupererListe(bloc);
							for (var k = 0, kMax = liste.length; k < kMax; ++k) {
								var elem = liste[k];
								resultatBloc += 3;
								for (var l = 0, lMax = elem.length; l < lMax; ++l) {
									if (elem.charAt(l) == "$") {
										++jokers;
									}
									if (elem.charAt(l) == "€") {
										resultatBloc -= 2;
									}
								}
								++resultatBloc;
							}
							resultatBloc += (jokers * Generateur.GN.nomsPropres.length);
							// pour dates aléatoires
							var nbAlea = new Date() / (1000 * 60 * 60 * 24);// valeur en jours de la fourchette courante
							nbAlea *= 11;// fourchette de la génération de Date.random()
							resultatBloc += (nbAlea * 2);// pour l'affichage (ou non) du nom du jour, exemple : "le (dimanche) 2 janvier 2011"
							resultatBloc += 4000;// pour les dates de Generateur.annee()
							break;
						case "CL":
						case "AF":
							var jokers = 0, jokersPlus = 0;
							var liste = Grimoire.recupererListe(bloc);
							for (var k = 0, kMax = liste.length; k < kMax; ++k) {
								var elem = liste[k];
								for (var l = 0, lMax = elem.length; l < lMax; ++l) {
									if (elem.charAt(l) == "$") {
										++jokers;
									}
									if (elem.charAt(l) == "+") {
										++jokersPlus;
									}
								}
								++resultatBloc;
							}
							resultatBloc += (jokers * Generateur.GN.nomsPropres.length);
							resultatBloc += Math.floor((jokersPlus * Generateur.GN.nomsCommuns.length) / 1.5);// approximation (on ne peut pas compter tous les noms communs car le genre doit correspondre)
							break;
						case "VT":
						case "VN":
						case "VM":
						case "VD":
						case "VA":
						case "VOA":
						case "VOD":
						case "VOI":
						case "VTL":
						case "VAV":
						case "VET":
						case "VOS":
						case "PR_T":
						case "PR_N":
							resultatBloc += Grimoire.recupererListe(bloc).length * (Grimoire.recupererListe("NG").length + 1);
						default:
							resultatBloc += Grimoire.recupererListe(bloc).length;
					}
				if ((bloc == "CT") || (bloc == "CL") || (bloc == "AF")) {

					var liste = Grimoire.recupererListe(bloc);
					var jokers = 0;
					var nombres = 9;// voir implémentation en dur dans Phrase() (c.a.d. un dé de 10, moins 1 ici pour la possibilité déjà décomptée "normalement " dans le switch) ^^' re-misère
					for (var k = 0, kMax = liste.length; k < kMax; ++k) {
						var elem = liste[k];
						for (var l = 0, lMax = elem.length; l < lMax; ++l) {
							if (elem.charAt(l) == "&") {
								++jokers;
							}
						}
					}
					resultatBloc += (jokers * nombres);

				}
				resultatStructure *= resultatBloc;
			}
			resultatStructure *= Grimoire.recupererListe("PF").length;// types de ponctuation finale

			tabResultat.push(resultatStructure);
		}
		return tabResultat;
	},

	Mots: {
		consonnes: ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "z", "cc", "ff", "ll", "mm", "nn", "pp", "rr", "ss", "tt"],
		multiConsonnes: ["bl", "br", "ch", "cl", "cr", "dj", "dr", "dz", "fl", "fr", "gl", "gn", "gr", "kl", "kr", "ks", "mn", "ph", "pl", "pr", "ps", "pt", "rb", "rc", "rd", "rf", "rg", "rj", "rk", "rl", "rm", "rn", "rp", "rq", "rs", "rt", "rv", "rz", "sc", "sk", "sm", "sn", "sp", "sq", "st", "tr", "ts", "vl", "vr", "zb", "zd", "zm"],
		voyelles: ["a", "e", "i", "o", "u", "y", "à", "â", "ä", "é", "è", "ê", "ë", "î", "ï", "ô", "ö", "ù", "û"],
		diphtongues: ["ai", "ain", "au", "an", "ei", "ein", "eu", "eau", "ou", "oui", "oi", "oin", "on", "ui"],
		PROBA_CONSONNES: [4, 3, 4, 3, 4, 1, 2, 1, 5, 5, 4, 5, 1, 5, 4, 6, 2, 1, 1, 1, 1, 1, 3, 2, 1, 1, 3, 4, 2],
		PROBA_CONSONNES_F: [0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 2, 2, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		PROBA_MULTICONSONNES_D: [2, 2, 3, 3, 3, 1, 2, 1, 2, 2, 2, 3, 3, 1, 1, 0, 1, 2, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 3, 3, 1, 1, 2, 0, 0, 0],
		PROBA_MULTICONSONNES: [2, 2, 3, 3, 3, 1, 2, 1, 2, 2, 2, 3, 3, 1, 1, 1, 1, 2, 3, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 3, 1, 1, 1, 1, 1, 1, 2, 1, 3, 3, 1, 1, 2, 1, 1, 1],
		PROBA_VOYELLES: [10, 12, 9, 9, 5, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1],
		PROBA_VOYELLES_F: [1, 4, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		PROBA_DIPHTONGUES: [1, 1, 2, 2, 1, 1, 2, 1, 3, 1, 3, 1, 3, 1],
		PROBA_DIPHTONGUES_F: [0, 3, 1, 2, 0, 1, 1, 2, 1, 0, 0, 1, 3, 0],
		syllabe: function (position, max) {
			if (position == 1) {
				var consonne = "";
				if (de(3) > 1) {
					do {
						consonne = (de(7) > 1) ?
								probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES) :
								probaSwitch(Generateur.Mots.multiConsonnes, Generateur.Mots.PROBA_MULTICONSONNES_D);
					} while ((consonne.length > 1) && consonne.estHomogene());
				}
				var voyelle = (de(5) > 1) ?
						probaSwitch(Generateur.Mots.voyelles, Generateur.Mots.PROBA_VOYELLES) :
						probaSwitch(Generateur.Mots.diphtongues, Generateur.Mots.PROBA_DIPHTONGUES);
				return consonne + voyelle;
			} else if (position == max) {// améliorer les finales (+ ajouter meta-donnees ici ?)
				var syll;
				if (de(3) > 1) {
					var consonne = (de(7) > 1) ?
							probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES) :
							probaSwitch(Generateur.Mots.multiConsonnes, Generateur.Mots.PROBA_MULTICONSONNES);
					var voyelle = (de(5) > 1) ?
							probaSwitch(Generateur.Mots.voyelles, Generateur.Mots.PROBA_VOYELLES_F) :
							probaSwitch(Generateur.Mots.diphtongues, Generateur.Mots.PROBA_DIPHTONGUES_F);
					syll = consonne + voyelle;
				} else {
					var consonne = (de(7) > 1) ?
							probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES) :
							probaSwitch(Generateur.Mots.multiConsonnes, Generateur.Mots.PROBA_MULTICONSONNES);
					var voyelle = (de(5) > 1) ?
							probaSwitch(Generateur.Mots.voyelles, Generateur.Mots.PROBA_VOYELLES) :
							probaSwitch(Generateur.Mots.diphtongues, Generateur.Mots.PROBA_DIPHTONGUES);
					var term = probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES_F);
					syll = consonne + voyelle + term;
				}
				return syll;
			} else {
				var consonne = (de(7) > 1) ?
						probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES) :
						probaSwitch(Generateur.Mots.multiConsonnes, Generateur.Mots.PROBA_MULTICONSONNES);
				var voyelle = (de(5) > 1) ?
						probaSwitch(Generateur.Mots.voyelles, Generateur.Mots.PROBA_VOYELLES) :
						probaSwitch(Generateur.Mots.diphtongues, Generateur.Mots.PROBA_DIPHTONGUES);
				return consonne + voyelle;
			}
		},
		mot: function (nbSyllabes) {
			var motRetour = "";
			for (var i = 0; i < nbSyllabes; ++i) {
				var syll = Generateur.Mots.syllabe(i + 1, nbSyllabes);
				motRetour += syll;
			}
			return motRetour.replace(/q([^u ])/g, "qu$1");
		}
	},
	date: function () {
		var d = Date.random();
		var tps = (d < new Date()) ? 1 : 3;
		var o = {lettres: 1};
		if (de(2) > 1)
			o.jour = 1;
		return "le " + d.formater(o) + "€" + tps;
	},
	annee: function () {
		var deb = "", fin = "", a = (de(4000) - 1001) || 3000;
		if (a < 300) {
			fin = ((a < 0) ? " avant" : " après") + " J.C.";
		}
		if ((a < 1000) || (a > 2100))
			deb = "l'an ";
		return "en " + deb + Math.abs(a) + fin;
	}
};

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// --------------------  EXTENSION DES OBJETS NATIFS JAVASCRIPT  -----------------

// FONCTION : répète n fois la chaine courante, avec ou sans séparateur
// PARAM #1 : "n" (number) : nombre de répétitions
// PARAM #2 : "sep" (string) : séparateur (éventuel) à insérer entre chaque répétition
// RETOUR : chaine (construite à partir de la chaine courante)
String.prototype.repeter = function (n, sep) {
	var chaine = "";
	n = Math.round(n);
	for (var i = 0; i < n; ++i)
		chaine += this + ((sep && (n > (i + 1))) ? sep : "");
	return chaine;
}

// FONCTION : insère une sous-chaine dans la chaine courante
// PARAM #1 : "chaine" (string) : sous-chaine à insérer
// PARAM #2 : "indice" (number) : emplacement de l'insertion
// RETOUR : chaine (construite à partir de la chaine courante)
String.prototype.inserer = function (chaine, indice) {
	if ((indice < 0) || (indice > this.length) || !chaine.toString)
		return false;
	return this.substr(0, indice) + chaine + this.substr(indice);
}

// FONCTION : remplace dans la chaine courante les lettres accentuées par leurs équivalents non accentués
// RETOUR : chaine (construite à partir de la chaine courante)
String.prototype.sansAccents = function () {
	return this.replace(/[ùûü]/g, "u").replace(/[îï]/g, "i").replace(/[àâä]/g, "a").replace(/[ôö]/g, "o").replace(/[éèêë]/g, "e").replace(/ç/g, "c");
}

// FONCTION : controle si une chaine est composée de caractères identiques
// RETOUR : booléen. renvoie "false" uniquement si la chaine continent au moins 2 caractères différents
String.prototype.estHomogene = function () {
	if (this.length > 1)
		for (var i = 1, iMax = this.length; i < iMax; ++i)
			if (this.charAt(0) != this.charAt(i))
				return false;
	// -_-'
	return true;
}

String.prototype.voyelle = function () {
	return (/^[aeiouyhàâäéèêëîïôöùûü]/i).test(this);
}

var ucfirst = function (str) {
	return str.charAt(0).toUpperCase() + str.substr(1);
}
var lcfirst = function (str) {
	return str.charAt(0).toLowerCase() + str.substr(1);
}

// superbe fusil à mouches ^^ neuf dans son étui : n'a jamais servi
Number.prototype.estMultipleDe = function (val) {
	return (val && (type(val).indexOf("number") > -1) && (val != 0)) ? ((this % val) == 0) : false;
}

// FONCTION : convertit un nombre en chaine de chiffres, avec le formatage souhaité
// PARAM #1 : "decimales" (number) : nombre de décimales souhaitées à l'affichage (ne modifie en rien le nombre courant)
// PARAM #2 : "sepDecimal" (string) : SI ce param est présent, il remplace le "." comme séparateur décimal
// PARAM #3 : "sepMilliers" (string) : SI ce param est présent, il est utilisé comme séparateur des milliers/millions/milliards/etc.
// RETOUR : chaine représentant le nombre courant
Number.prototype.formater = function (decimales, sepDecimal, sepMilliers) {
	var resultat = this.toFixed(decimales);
	if (sepDecimal)
		resultat = resultat.replace(/\./, sepDecimal);
	if (sepMilliers) {
		var offset = 0;
		var posPoint = resultat.indexOf((sepDecimal) ? sepDecimal : ".");
		if (posPoint == -1)
			posPoint = resultat.length;
		while ((posPoint - offset) > 3) {
			resultat = resultat.inserer(sepMilliers, (posPoint - offset - 3));
			offset += 3;
		}
	}
	return resultat;
}

// FONCTION : convertit le nombre courant en toutes lettres (sans l'éventuelle partie décimale)
// RETOUR : chaine représentant le nombre courant
Number.prototype.enLettres = function () {
	if (Math.abs(this) > 999999999999)
		return false;
	var negatif;
	if (this < 0)
		negatif = true;
	var chaine = Math.abs(this).toFixed();
	if (chaine == "1001")
		return ((negatif) ? "moins " : "") + "mille-et-un";
	var resultat = "";

	// tableau de correspondance pour tout nombre compris entre 0 et 99
	// on accède par exemple à "42" par >>> nombresFr[4][2]
	var nombresFr = [
		["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "£uit", "neuf"],
		["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"],
		["vingt", "vingt et un", "vingt-deux", "vingt-trois", "vingt-quatre", "vingt-cinq", "vingt-six", "vingt-sept", "vingt-huit", "vingt-neuf"],
		["trente", "trente et un", "trente-deux", "trente-trois", "trente-quatre", "trente-cinq", "trente-six", "trente-sept", "trente-huit", "trente-neuf"],
		["quarante", "quarante et un", "quarante-deux", "quarante-trois", "quarante-quatre", "quarante-cinq", "quarante-six", "quarante-sept", "quarante-huit", "quarante-neuf"],
		["cinquante", "cinquante et un", "cinquante-deux", "cinquante-trois", "cinquante-quatre", "cinquante-cinq", "cinquante-six", "cinquante-sept", "cinquante-huit", "cinquante-neuf"],
		["soixante", "soixante et un", "soixante-deux", "soixante-trois", "soixante-quatre", "soixante-cinq", "soixante-six", "soixante-sept", "soixante-huit", "soixante-neuf"],
		["soixante-dix", "soixante et onze", "soixante-douze", "soixante-treize", "soixante-quatorze", "soixante-quinze", "soixante-seize", "soixante-dix-sept", "soixante-dix-huit", "soixante-dix-neuf"],
		["quatre-vingt", "quatre-vingt-un", "quatre-vingt-deux", "quatre-vingt-trois", "quatre-vingt-quatre", "quatre-vingt-cinq", "quatre-vingt-six", "quatre-vingt-sept", "quatre-vingt-huit", "quatre-vingt-neuf"],
		["quatre-vingt-dix", "quatre-vingt-onze", "quatre-vingt-douze", "quatre-vingt-treize", "quatre-vingt-quatorze", "quatre-vingt-quinze", "quatre-vingt-seize", "quatre-vingt-dix-sept", "quatre-vingt-dix-huit", "quatre-vingt-dix-neuf"]
	];
	var grandeursFr = [["cent", "mille", "million", "milliard"], ["cents", "mille", "millions", "milliards"]];

	// découpage de la chaine en blocs de 3 chiffres, en partant des unités
	// par exemple, pour le nombre courant 42150, on obtient après cette étape le tableau suivant : tabBloc >>> ["42", "150"]
	var blocs = [];
	var longueur = chaine.length;
	while (longueur > 0) {
		if (longueur > 3) {
			blocs.splice(0, 0, chaine.substr((longueur - 3), 3));
			chaine = chaine.substr(0, longueur - 3);
		} else {
			blocs.splice(0, 0, chaine);
			chaine = "";
		}
		longueur = chaine.length;
	}

	// boucle sur les blocs : découpage du bloc courant, calcul de la chaine correspondante au bloc courant, stockage dans le tabResultat
	var tabResultat = [], tabBloc, bloc;
	for (var i = 0; i < blocs.length; ++i) {
		bloc = blocs[i];
		tabBloc = [];
		for (var j = 0; j < bloc.length; ++j)
			tabBloc.push(parseInt(bloc.substr(j, 1), 10));
		while (tabBloc.length < 3)
			tabBloc.splice(0, 0, 0);
		var sousResultat = nombresFr[tabBloc[1]][tabBloc[2]];
		if (tabBloc[0] > 1) {
			var exception100 = (tabBloc[0] > 1) && (sousResultat == "zéro") && (i == (blocs.length - 1));
			var centaines = nombresFr[0][tabBloc[0]] + " " + grandeursFr[(exception100) ? 1 : 0][0];
			tabResultat.push(centaines + ((sousResultat == "zéro") ? "" : " " + sousResultat));
		} else if (tabBloc[0] == 1)
			tabResultat.push("cent" + ((sousResultat == "zéro") ? "" : " " + sousResultat));
		else if (sousResultat != "zéro")
			tabResultat.push(sousResultat);
		if ((blocs.length > (i + 1)) && (bloc != "000")) {
			var grandeur = grandeursFr[(tabResultat[i] == "un") ? 0 : 1][blocs.length - i - 1];
			tabResultat[((i == (blocs.length - 2)) && (bloc == "1")) ? (tabResultat.length - 1) : tabResultat.length] = grandeur;
		}
		if ((/80$/).test(bloc) && (blocs.length == (i + 1)))
			tabResultat[tabResultat.length - 1] = tabResultat[tabResultat.length - 1].replace(/quatre\-vingt/, "quatre-vingts");
	}
	resultat = tabResultat.join(" ");
	return (((negatif) ? "moins " : "") + resultat) || nombresFr[0][0];
}

// rustine tirée de Prototype (merci les gars ^_^') pour assurer Array.indexOf dans IE
if (!Array.prototype.indexOf)
	Array.prototype.indexOf = function (item, i) {
		i || (i = 0);
		var length = this.length;
		if (i < 0)
			i = length + i;
		for (; i < length; i++)
			if (this[i] === item)
				return i;
		return -1;
	}

// FONCTION : prend un élément au hasard dans le tableau courant
// PARAM : si présent et évalué "true", supprime du tableau courant l'élément désigné
// RETOUR : l'élément désigné aléatoirement
Array.prototype.puiser = function (vidage) {
	var jet = de(this.length) - 1;
	var retour = this[jet];
	if (vidage)
		this.splice(jet, 1);
	return retour;
}

// FONCTION : ajoute un ou plusieurs éléments à chacun des tableaux contenus dans le tableau courant
// RETOUR : aucun
// ATTENTION : ne fonctionne que sur un tableau de tableaux, pas de contrôle/remontée d'erreur de type
Array.prototype.pushEach = function () {
	for (var j = 0, jMax = arguments.length; j < jMax; ++j) {
		var val = arguments[j];
		for (var i = 0, iMax = this.length; i < iMax; ++i) {
			this[i].push(val);
		}
	}
}

// FONCTION : copie le tableau courant par valeur (et non pas deux références au même élément)
// RETOUR : copie conforme du tableau courant (taille, indices, valeurs)
Array.prototype.cloner = function () {
	var clone = new Array();
	for (var i = 0; i < this.length; ++i)
		if (type(this[i]) == "array") {
			clone[i] = this[i].cloner();
		} else {
			clone[i] = this[i];
		}
	return clone;
}

// FONCTION : additionne toutes les valeurs numériques contenues dans un tableau, et ignore les autres valeurs
// RETOUR : la somme calculée
Array.prototype.additionner = function () {
	var somme = 0;
	for (var i = 0, iMax = this.length; i < iMax; ++i) {
		if (type(this[i]).indexOf("number") > -1) {
			somme += this[i];
		}
	}
	return somme;
}

// FONCTION : repère les doublons dans le tableau courant
// RETOUR : tableau contenant les doublons
Array.prototype.chercherDoublons = function () {
	var doublons = [];
	for (var i = 0; i < this.length - 1; ++i) {
		for (var j = i + 1; j < this.length; ++j) {
			if (this[i] == this[j]) {
				doublons.push(this[j]);
			}
		}
	}
	return doublons.cloner();
}

// FONCTION : formate la date courante selon les options choisies
// PARAM #1 : "options" (objet anonyme) comportant 6 options :
// "separateur"      >>> si présent, est utilisé pour séparer les trois groupes de nombres ; inutile si "lettres" (toujours séparateur espace)
// "inverse"         >>> si "équivalent à TRUE", format AMJ à la place de JMA
// "zeros"           >>> si "équivalent à TRUE", les zéros non-significatifs sont conservés (ex : mai >>> 05)
// "AA"              >>> si "équivalent à TRUE", l'année n'est représentée que sur deux chiffres
// "jour"            >>> si "équivalent à TRUE", le jour de la semaine préfixe la chaine (mot complet avec "options.lettres", sinon seulement l'initiale en capitale)
// "lettres"         >>> si "équivalent à TRUE", le nom du mois est écrit en toutes lettres
// RETOUR : chaine représentant la date courante
Date.prototype.formater = function (options) {
	options = options || {};
	var resultat = [], retour = "";
	resultat[options.inverse ? 2 : 0] = (options.zeros && this.getUTCDate() < 10) ? "0" + this.getUTCDate() : this.getUTCDate();
	resultat[1] = (options.zeros && this.getUTCMonth() < 9) ? "0" + (this.getUTCMonth() + 1) : this.getUTCMonth() + 1;
	resultat[options.inverse ? 0 : 2] = options.AA ? this.getUTCFullYear().toString().substr(2) : this.getUTCFullYear();

	if (options.lettres) {
		var moisFr = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
		resultat[1] = moisFr[parseInt((resultat[1] - 1), 10)];
		options.separateur = " ";
		if (this.getUTCDate() == 1)
			resultat[options.inverse ? 2 : 0] += "er";
	}

	if (options.jour) {
		var joursFr = options.lettres ?
				["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] :
				["D", "L", "M", "M", "J", "V", "S"];
		retour = resultat.join(options.separateur ? options.separateur : "");
		retour = joursFr[this.getDay()] + " " + retour;
		return retour;
	}
	return resultat.join(options.separateur ? options.separateur : "");
}

Date.random = function () {
	return new Date(de(new Date().getTime() * 11) - (new Date().getTime() * 8));
}


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// -----------------------------  FONCTIONS GENERALES  ---------------------------

// FONCTION : détermine le type de l'objet passé en paramètre
// PARAM #1 : "objet" (object) : objet à examiner
// RETOUR : chaine décrivant le type :
// ("string", "number(int)", "number(float)", "date", "array", "function", "element", "node", "object", "undefined")
function type(objet) {
	if (typeof objet == "string")
		return "string";
	if (typeof objet == "number")
		return (Math.round(objet) != objet) ? "number(float)" : "number(int)";
	if ((objet != null) && ("getUTCFullYear" in objet))
		return "date";
	if (typeof objet == "function")
		return "function";
	if ((objet != null) && ("splice" in objet) && ("join" in objet))
		return "array";
	if ((objet != null) && objet.nodeType)
		return (objet.nodeType == Node.ELEMENT_NODE) ? "element" : "node";
	if ((objet != null) && (typeof objet == "object"))
		return "object";

	return "undefined";
}

// FONCTION : simulation de jet de dé
// PARAM #1 : "max" (number) : nombre de "faces"
// RETOUR : entier aléatoire entre 1 et "max"
function de(max) {
	if (max < 1) {
		return 0;
	}
	return Math.round((Math.random() * max) + .5);
}

function deProgressif_1() {
	var nombre, jetQuantite = de(100);
	if (jetQuantite < 60) {
		nombre = de(4) + 1;
	} else if (jetQuantite < 90) {
		nombre = de(10) + de(10) + de(10);
	} else if (jetQuantite < 97) {
		nombre = de(10) * 10;
	} else if (jetQuantite < 99) {
		nombre = de(100) * 100;
	} else {
		nombre = de(1000) + 1;
	}
	return nombre;
}

function probaSwitch(tabValeurs, tabPoids) {

	if (tabValeurs.length != tabPoids.length) {
		console.log("arguments de la fonction probaSwitch() mal formés :\ntabValeurs.length = " + tabValeurs.length + "\ntabPoids.length = " + tabPoids.length);
		return null;
	}

	var somme = tabPoids.additionner();
	var echelle = 100 / somme;
	for (var i = 0, iMax = tabValeurs.length; i < iMax; ++i) {
		tabPoids[i] *= echelle;
	}

	var seuil, tirage = Math.random() * 100;
	for (var i = 0, iMax = tabValeurs.length; i < iMax; ++i) {
		seuil = 0;
		for (var j = 0; j <= i; ++j) {
			seuil += tabPoids[j];
		}
		if (tirage <= seuil) {
			return tabValeurs[i];
		}
		if (i == (iMax - 1)) {
			return tabValeurs[i];
		}
	}
	return null;
}

module.exports = {
	generer_une_phrase: function (options) {
		options || (options = {});
		var avecSujet = options.avecSujet;
		var sujet = options.sujet;
		var personne = options.personne || 3;

		Generateur.Memoire.sujetAuChoix = null;
		if (avecSujet && sujet && sujet.length) {
			Generateur.Memoire.sujetAuChoix = sujet + "@" + personne;
		}

		var opts = {};
		opts.structure = options.structure;
		if (Generateur.Memoire.sujetAuChoix) {
			opts.sujetChoisi = Generateur.Memoire.sujetAuChoix;
		}
		var p = new Phrase(opts);

		Generateur.Memoire.precedenteStructure = p.structure;
		Generateur.Memoire.generations++;

		var result = p.lire();

		if (options.prepend) {
			result = options.prepend + lcfirst(result);
		}

		return result;
	}
};



