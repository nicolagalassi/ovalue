<!DOCTYPE html>
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
	<meta http-equiv="Cache-Control" content="no-cache" />
	<title>OGame - Calcolatore di Costi per le forme di vita</title>
	<meta name="description" content="OGame - Calcolatore di Costi per le forme di vita"/>
	<meta name="keywords" content="proxyforgame,proxy,online,calc,calculator,ogame,price calculation,cost calculation,buildings costs,research costs,fleet costs,defence costs,costs calculator,prices calculator,costi di costruzione, il costo della ricerca, costi di costruzione, il costo della flotta, il costo della difesa, calcolo dei costi"/>
	<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
	<link rel="icon" href="/favicon.ico" type="image/x-icon"/>
	<link id="light-theme" type="text/css" href="/css/redmond/jquery.ui.all.css" rel="stylesheet"/>
	<link id="dark-theme" type="text/css" href="/css/dark-hive/jquery.ui.all.css" rel="stylesheet" disabled="disabled"/>
	<link type="text/css" href="/css/jquery.ui.spinbtn.css" rel="stylesheet"/>
	<link type="text/css" href="/css/langs.css?v=1707812078" rel="stylesheet" />
	<link type="text/css" href="/css/common.css?v=1768363724" rel="stylesheet"/>
	<link type="text/css" href="/ogame/calc/css/costs.css?v=1707812078" rel="stylesheet"/>

	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>
	<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.11/jquery-ui.min.js"></script>
	<script type="text/javascript" src="/js/jquery.cookie.js"></script>
	<script type="text/javascript" src="/js/utils.js?v=1768363724"></script>
	<script type="text/javascript" src="/ogame/calc/js/common.js?v=1763774195"></script>	
	<script type="text/javascript" src="/ogame/calc/js/lfcosts.js?v=1768123895"></script>

	<script type="text/javascript">
		// десятичный разделитель будет использоваться в функциях, проверяющих валидность чисел в input-ах
		options.decimalSeparator=',';
		options.datetimeW = 'st';
		options.datetimeD = 'g';
		options.datetimeH = 'o';
		options.datetimeM = 'm';
		options.datetimeS = 's';
		options.unitSuffix = 'KMG';
		options.scShort = 'CL';
		options.lcShort = 'CP';
		options.scFull = 'Cargo Leggero';
		options.lcFull = 'Cargo Pesante';
		options.warnindDivId = 'warning';
		options.warnindMsgDivId = 'warning-message';
		options.fieldHint = 'per il campo [{0}]';
		options.msgMinConstraintViolated = 'Valore {0} {1} sia inferiore al minimo {2}. Valore del campo impostato al minimo.';
		options.msgMaxConstraintViolated = 'Valore {0} {1} e superiore al massimo {2}. Valore del campo impostato al massimo.';

		options.techCosts = {
																					1001:[7, 2, 0, 0,
								40, 1.2, 1.2, 0, 0, 1.21]
																					,1002:[5, 2, 0, 8,
								40, 1.23, 1.23, 0, 1.02, 1.25]
																					,1003:[20000, 25000, 10000, 10,
								16000, 1.3, 1.3, 1.3, 1.08, 1.25]
																					,1004:[5000, 3200, 1500, 15,
								16000, 1.7, 1.7, 1.7, 1.25, 1.6]
																					,1005:[50000, 40000, 50000, 30,
								64000, 1.7, 1.7, 1.7, 1.25, 1.7]
																					,1006:[9000, 6000, 3000, 40,
								2000, 1.5, 1.5, 1.5, 1.1, 1.3]
																					,1007:[25000, 13000, 7000, 0,
								12000, 1.09, 1.09, 1.09, 0, 1.17]
																					,1008:[50000, 25000, 15000, 80,
								28000, 1.5, 1.5, 1.5, 1.1, 1.2]
																					,1009:[75000, 20000, 25000, 50,
								40000, 1.09, 1.09, 1.09, 1.02, 1.2]
																					,1010:[150000, 30000, 15000, 60,
								52000, 1.12, 1.12, 1.12, 1.03, 1.2]
																					,1011:[80000, 35000, 60000, 90,
								90000, 1.5, 1.5, 1.5, 1.05, 1.3]
																					,1012:[250000, 125000, 125000, 100,
								95000, 1.15, 1.15, 1.15, 1.02, 1.2]
																					,1101:[5000, 2500, 500, 0,
								1000, 1.3, 1.3, 1.3, 0, 1.2]
																					,1102:[7000, 10000, 5000, 0,
								2000, 1.5, 1.5, 1.5, 0, 1.3]
																					,1103:[15000, 10000, 5000, 0,
								2500, 1.3, 1.3, 1.3, 0, 1.3]
																					,1104:[20000, 15000, 7500, 0,
								3500, 1.3, 1.3, 1.3, 0, 1.3]
																					,1105:[24750, 19800, 9900, 0,
								4140, 1.3, 1.3, 1.3, 0, 1.2]
																					,1106:[35000, 25000, 15000, 0,
								5000, 1.5, 1.5, 1.5, 0, 1.3]
																					,1107:[70000, 40000, 20000, 0,
								8000, 1.3, 1.3, 1.3, 0, 1.3]
																					,1108:[80000, 50000, 20000, 0,
								6000, 1.5, 1.5, 1.5, 0, 1.3]
																					,1109:[320000, 240000, 100000, 0,
								6500, 1.5, 1.5, 1.5, 0, 1.4]
																					,1110:[320000, 240000, 100000, 0,
								7000, 1.5, 1.5, 1.5, 0, 1.4]
																					,1111:[120000, 30000, 25000, 0,
								7500, 1.5, 1.5, 1.5, 0, 1.3]
																					,1112:[100000, 40000, 30000, 0,
								10000, 1.3, 1.3, 1.3, 0, 1.3]
																					,1113:[200000, 100000, 100000, 0,
								8500, 1.3, 1.3, 1.3, 0, 1.3]
																					,1114:[160000, 120000, 50000, 0,
								9000, 1.5, 1.5, 1.5, 0, 1.4]
																					,1115:[160000, 120000, 50000, 0,
								9500, 1.5, 1.5, 1.5, 0, 1.4]
																					,1116:[320000, 240000, 100000, 0,
								10000, 1.5, 1.5, 1.5, 0, 1.4]
																					,1117:[300000, 180000, 120000, 0,
								11000, 1.5, 1.5, 1.5, 0, 1.3]
																					,1118:[500000, 300000, 200000, 0,
								13000, 1.3, 1.3, 1.3, 0, 1.3]
																					,2001:[9, 3, 0, 0,
								40, 1.2, 1.2, 0, 0, 1.21]
																					,2002:[7, 2, 0, 10,
								40, 1.2, 1.2, 0, 1.03, 1.21]
																					,2003:[40000, 10000, 15000, 15,
								16000, 1.3, 1.3, 1.3, 1.1, 1.25]
																					,2004:[5000, 3800, 1000, 20,
								16000, 1.7, 1.7, 1.7, 1.35, 1.6]
																					,2005:[50000, 40000, 50000, 60,
								64000, 1.65, 1.65, 1.65, 1.3, 1.7]
																					,2006:[10000, 8000, 1000, 40,
								2000, 1.4, 1.4, 1.4, 1.1, 1.3]
																					,2007:[20000, 15000, 10000, 0,
								16000, 1.2, 1.2, 1.2, 0, 1.25]
																					,2008:[50000, 35000, 15000, 80,
								40000, 1.5, 1.5, 1.5, 1.3, 1.4]
																					,2009:[85000, 44000, 25000, 90,
								40000, 1.4, 1.4, 1.4, 1.1, 1.2]
																					,2010:[120000, 50000, 20000, 90,
								52000, 1.4, 1.4, 1.4, 1.1, 1.2]
																					,2011:[250000, 150000, 100000, 120,
								90000, 1.8, 1.8, 1.8, 1.3, 1.3]
																					,2012:[250000, 125000, 125000, 100,
								95000, 1.5, 1.5, 1.5, 1.1, 1.3]
																					,2101:[10000, 6000, 1000, 0,
								1000, 1.5, 1.5, 1.5, 0, 1.3]
																					,2102:[7500, 12500, 5000, 0,
								2000, 1.5, 1.5, 1.5, 0, 1.3]
																					,2103:[15000, 10000, 5000, 0,
								2500, 1.5, 1.5, 1.5, 0, 1.3]
																					,2104:[20000, 15000, 7500, 0,
								3500, 1.3, 1.3, 1.3, 0, 1.4]
																					,2105:[25000, 20000, 10000, 0,
								4500, 1.5, 1.5, 1.5, 0, 1.3]
																					,2106:[50000, 50000, 20000, 0,
								5000, 1.5, 1.5, 1.5, 0, 1.3]
																					,2107:[70000, 40000, 20000, 0,
								5500, 1.5, 1.5, 1.5, 0, 1.3]
																					,2108:[160000, 120000, 50000, 0,
								6000, 1.5, 1.5, 1.5, 0, 1.4]
																					,2109:[75000, 55000, 25000, 0,
								6500, 1.5, 1.5, 1.5, 0, 1.3]
																					,2110:[85000, 40000, 35000, 0,
								7000, 1.5, 1.5, 1.5, 0, 1.3]
																					,2111:[120000, 30000, 25000, 0,
								7500, 1.5, 1.5, 1.5, 0, 1.3]
																					,2112:[100000, 40000, 30000, 0,
								8000, 1.5, 1.5, 1.5, 0, 1.3]
																					,2113:[200000, 100000, 100000, 0,
								8500, 1.2, 1.2, 1.2, 0, 1.3]
																					,2114:[220000, 110000, 110000, 0,
								9000, 1.3, 1.3, 1.3, 0, 1.3]
																					,2115:[240000, 120000, 120000, 0,
								9500, 1.3, 1.3, 1.3, 0, 1.3]
																					,2116:[250000, 250000, 250000, 0,
								10000, 1.4, 1.4, 1.4, 0, 1.4]
																					,2117:[500000, 300000, 200000, 0,
								13000, 1.5, 1.5, 1.5, 0, 1.3]
																					,2118:[300000, 180000, 120000, 0,
								11000, 1.7, 1.7, 1.7, 0, 1.4]
																					,3001:[6, 2, 0, 0,
								40, 1.21, 1.21, 0, 0, 1.22]
																					,3002:[5, 2, 0, 8,
								48, 1.18, 1.18, 0, 1.02, 1.2]
																					,3003:[30000, 20000, 10000, 13,
								16000, 1.3, 1.3, 1.3, 1.08, 1.25]
																					,3004:[5000, 3800, 1000, 10,
								16000, 1.8, 1.8, 1.8, 1.2, 1.6]
																					,3005:[50000, 40000, 50000, 40,
								64000, 1.8, 1.8, 1.8, 1.2, 1.7]
																					,3006:[7500, 7000, 1000, 0,
								2000, 1.3, 1.3, 1.3, 0, 1.3]
																					,3007:[35000, 15000, 10000, 40,
								16000, 1.5, 1.5, 1.5, 1.05, 1.4]
																					,3008:[50000, 20000, 30000, 40,
								12000, 1.07, 1.07, 1.07, 1.01, 1.17]
																					,3009:[100000, 10000, 3000, 80,
								40000, 1.14, 1.14, 1.14, 1.04, 1.3]
																					,3010:[100000, 40000, 20000, 60,
								52000, 1.5, 1.5, 1.5, 1.1, 1.2]
																					,3011:[55000, 50000, 30000, 70,
								50000, 1.5, 1.5, 1.5, 1.05, 1.3]
																					,3012:[250000, 125000, 125000, 100,
								95000, 1.4, 1.4, 1.4, 1.05, 1.4]
																					,3101:[10000, 6000, 1000, 0,
								1000, 1.5, 1.5, 1.5, 0, 1.3]
																					,3102:[7500, 12500, 5000, 0,
								2000, 1.3, 1.3, 1.3, 0, 1.3]
																					,3103:[15000, 10000, 5000, 0,
								2500, 1.5, 1.5, 1.5, 0, 1.4]
																					,3104:[20000, 15000, 7500, 0,
								3500, 1.3, 1.3, 1.3, 0, 1.3]
																					,3105:[160000, 120000, 50000, 0,
								4500, 1.5, 1.5, 1.5, 0, 1.4]
																					,3106:[50000, 50000, 20000, 0,
								5000, 1.5, 1.5, 1.5, 0, 1.3]
																					,3107:[70000, 40000, 20000, 0,
								5500, 1.3, 1.3, 1.3, 0, 1.3]
																					,3108:[160000, 120000, 50000, 0,
								6000, 1.5, 1.5, 1.5, 0, 1.4]
																					,3109:[160000, 120000, 50000, 0,
								6500, 1.5, 1.5, 1.5, 0, 1.4]
																					,3110:[85000, 40000, 35000, 0,
								7000, 1.2, 1.2, 1.2, 0, 1.3]
																					,3111:[120000, 30000, 25000, 0,
								7500, 1.3, 1.3, 1.3, 0, 1.3]
																					,3112:[160000, 120000, 50000, 0,
								8000, 1.5, 1.5, 1.5, 0, 1.4]
																					,3113:[200000, 100000, 100000, 0,
								8500, 1.5, 1.5, 1.5, 0, 1.3]
																					,3114:[160000, 120000, 50000, 0,
								9000, 1.5, 1.5, 1.5, 0, 1.4]
																					,3115:[320000, 240000, 100000, 0,
								9500, 1.5, 1.5, 1.5, 0, 1.4]
																					,3116:[320000, 240000, 100000, 0,
								10000, 1.5, 1.5, 1.5, 0, 1.4]
																					,3117:[500000, 300000, 200000, 0,
								13000, 1.5, 1.5, 1.5, 0, 1.3]
																					,3118:[300000, 180000, 120000, 0,
								11000, 1.7, 1.7, 1.7, 0, 1.4]
																					,4001:[4, 3, 0, 0,
								40, 1.21, 1.21, 0, 0, 1.22]
																					,4002:[6, 3, 0, 9,
								40, 1.2, 1.2, 0, 1.02, 1.22]
																					,4003:[20000, 15000, 15000, 10,
								16000, 1.3, 1.3, 1.3, 1.08, 1.25]
																					,4004:[7500, 5000, 800, 15,
								16000, 1.8, 1.8, 1.8, 1.3, 1.7]
																					,4005:[60000, 30000, 50000, 30,
								64000, 1.8, 1.8, 1.8, 1.3, 1.8]
																					,4006:[8500, 5000, 3000, 0,
								2000, 1.25, 1.25, 1.25, 0, 1.35]
																					,4007:[15000, 15000, 5000, 0,
								12000, 1.2, 1.2, 1.2, 0, 1.2]
																					,4008:[75000, 25000, 30000, 30,
								16000, 1.05, 1.05, 1.05, 1.03, 1.18]
																					,4009:[87500, 25000, 30000, 40,
								40000, 1.2, 1.2, 1.2, 1.02, 1.2]
																					,4010:[150000, 30000, 30000, 140,
								52000, 1.4, 1.4, 1.4, 1.05, 1.8]
																					,4011:[75000, 50000, 55000, 90,
								90000, 1.2, 1.2, 1.2, 1.04, 1.3]
																					,4012:[500000, 250000, 250000, 100,
								95000, 1.4, 1.4, 1.4, 1.05, 1.3]
																					,4101:[10000, 6000, 1000, 0,
								1000, 1.5, 1.5, 1.5, 0, 1.4]
																					,4102:[7500, 12500, 5000, 0,
								2000, 1.5, 1.5, 1.5, 0, 1.3]
																					,4103:[15000, 10000, 5000, 0,
								2500, 1.5, 1.5, 1.5, 0, 1.4]
																					,4104:[20000, 15000, 7500, 0,
								3500, 1.5, 1.5, 1.5, 0, 1.4]
																					,4105:[25000, 20000, 10000, 0,
								4500, 1.5, 1.5, 1.5, 0, 1.4]
																					,4106:[50000, 50000, 20000, 0,
								5000, 1.3, 1.3, 1.3, 0, 1.4]
																					,4107:[70000, 40000, 20000, 0,
								5500, 1.5, 1.5, 1.5, 0, 1.3]
																					,4108:[80000, 50000, 20000, 0,
								6000, 1.2, 1.2, 1.2, 0, 1.2]
																					,4109:[320000, 240000, 100000, 0,
								6500, 1.5, 1.5, 1.5, 0, 1.4]
																					,4110:[85000, 40000, 35000, 0,
								7000, 1.2, 1.2, 1.2, 0, 1.2]
																					,4111:[120000, 30000, 25000, 0,
								7500, 1.5, 1.5, 1.5, 0, 1.4]
																					,4112:[100000, 40000, 30000, 0,
								8000, 1.5, 1.5, 1.5, 0, 1.3]
																					,4113:[200000, 100000, 100000, 0,
								8500, 1.5, 1.5, 1.5, 0, 1.3]
																					,4114:[160000, 120000, 50000, 0,
								9000, 1.5, 1.5, 1.5, 0, 1.4]
																					,4115:[240000, 120000, 120000, 0,
								9500, 1.5, 1.5, 1.5, 0, 1.4]
																					,4116:[320000, 240000, 100000, 0,
								10000, 1.5, 1.5, 1.5, 0, 1.4]
																					,4117:[500000, 300000, 200000, 0,
								13000, 1.5, 1.5, 1.5, 0, 1.3]
																					,4118:[300000, 180000, 120000, 0,
								11000, 1.7, 1.7, 1.7, 0, 1.4]
																	};

	</script>
</head>

<body class="ui-widget">

<table id="vtable" cellspacing="2" cellpadding="0" border="0"><tr>
<td id="vtablesb">﻿
<link type="text/css" href="/css/sidebar.css?v=1707812078" rel="stylesheet" />
<script type="text/javascript">
var buttonsText = {};
buttonsText.send = 'Invia';
buttonsText.cancel = 'Annulla';
buttonsText.correct = 'Risolvere';
buttonsText.ok = 'OK';
var currUrl = '/it/ogame/calc/lfcosts.php';
let currChange = { value: 44, validate: function(key, val) { return val; } };
var currLang = 'it';
</script>
<script type="text/javascript" src="/js/sidebar.js?v=1765242486"></script>

<div id="sidebar">
	<a class="ui-widget-header" href="/it/">Home page</a>
	<div class="ui-panel">Calcolatrici<br/>per OGame <font size="1">(12)</font></div>
	<div>
						<a class="ui-state-default" href="/it/ogame/calc/trade.php">Calcolatore di Rapporti Commercio</a>
								<a class="ui-state-default" href="/it/ogame/calc/costs.php">Calcolatore di Costi</a>
								<div class="ui-state-active">Calcolatore di Costi (FV)</div>
								<a class="ui-state-default" href="/it/ogame/calc/queue.php">Coda di costruzione</a>
								<a class="ui-state-default" href="/it/ogame/calc/production.php">Produzione ed energia</a>
								<a class="ui-state-default" href="/it/ogame/calc/graviton.php">Calcolatore per Gravitonica</a>
								<a class="ui-state-default" href="/it/ogame/calc/terraformer.php">Terraformer</a>
								<a class="ui-state-default" href="/it/ogame/calc/flight.php">Tempi di viaggio</a>
								<a class="ui-state-default" href="/it/ogame/calc/moon.php">Moons</a>
								<a class="ui-state-default" href="/it/ogame/calc/expeditions.php">Spedizioni</a>
				</div>
	<div class="spacer">&nbsp;</div>
	<div class="ui-panel">Retroazione</div>
	<div class="ui-state-active feedback">
		Trovato un errore? Selezionare il testo e <br/><a href="#" onclick="findSelection();" style="display: inline">premere Ctrl + Invio</a><br/>per dirci al riguardo.	</div>
	<div class="ui-state-active feedback">
		Se avete domande o commenti,<br/><a href="#" onclick="showEmailWindow();" style="display: inline">clicca qui</a><br/>per inviarci una e-mail.	</div>
	<div class="ui-state-active feedback">
		Se si può aiutare con la traduzione<br/>di siti, si prega di visitare il<br/><a href="http://board.origin.ogame.de/board6-origin/board24-localization-area/board153-fan-project-s-translations/1936-online-tools-collection-translation" style = "display: inline" target = "blank";>Forum OGame Origin</a>	</div>
	<div class="ui-state-active feedback">
		Unisciti al nostro<br/><a href="https://discord.gg/H8xPdA9FbE" style="display: inline" target="_blank">server Discord</a>,<br/>per discutere del sito,<br/>segnalare un bug<br/>o fare un suggerimento.<br/>	</div>
	<div class="spacer">&nbsp;</div>
		
	<div class="spacer">&nbsp;</div>
	<div class="ui-panel">Cookies</div>
	<div class="ui-state-active feedback">
		<a href="/policy.php" style="display: inline" target="_blank">Privacy Policy</a>
	</div>
	
	<div class="spacer">&nbsp;</div>
	<div >
		<a href="https://github.com/Ogeeon/proxyforgame" target="_blank" rel="noopener noreferrer" title="ProxyForGame on GitHub">
			<img id="github-icon" alt="" width="30" height="30" src="/images/github.png"/>
		</a>
	</div>

	<div class="spacer">&nbsp;</div>
	<div class="ui-state-active changelog">
		<a href="#" onclick="requestAndShowChangelog(-1);">Registro delle modifiche</a>
	</div>

</div>

<div id="report-form" title="Invio di un rapporto di errore di ortografia" class="ui-helper-hidden">
	<div id="report-data" class="ui-widget-content ui-corner-all">
		<div id="report-info">
			Per inviare un rapporto di errore di ortografia si prega di specificare il testo scritto male e la tua versione di esso.		</div>
		<table align="center">
			<tr><td>Parole sbagliate</td></tr>
			<tr><td><input type="text" class="ui-state-default ui-input ui-corner-all correction-input" id="misspelled-text" value=""/></td></tr>
			<tr><td>Parole giuste</td></tr>
			<tr><td><input type="text" class="ui-state-default ui-input ui-corner-all correction-input" id="corrected-text" value=""/></td></tr>
		</table>
	</div>
	<div id="report-progress">
		<div id="progress-text">L'invio del rapporto...</div>
		<div><img src="/images/progress.gif" alt=""/></div>
	</div>
	<div id="report-err-0" class="ui-helper-hidden">
		<p>Il tuo rapporto è stato inviato. Grazie.</p>
	</div>
	<div id="report-err-1" class="ui-helper-hidden">
		<p>Error in request: no service.</p>
	</div>
	<div id="report-err-2" class="ui-helper-hidden">
		<p>Error in request: unknown service.</p>
	</div>
	<div id="report-err-3" class="ui-helper-hidden">
		<p>Error in request: obligatory params missing.</p>
	</div>
	<div id="report-err-4" class="ui-helper-hidden">
		<p>Entrambi i campi sono vuoti. Si prega di specificare il testo scritto male e la tua versione di esso.</p>
	</div>
	<div id="report-err-5" class="ui-helper-hidden">
		<p>Il contenuto del campo [Parole giuste] è identico al contenuto del campo [Parole sbagliate]. Si prega di specificare la versione del testo scritto male.</p>
	</div>
	<div id="report-err-6" class="ui-helper-hidden">
		<p>Il campo [Parole sbagliate] è vuoto. Si prega di specificare il parole sbagliate.</p>
	</div>
	<div id="report-err-7" class="ui-helper-hidden">
		<p>Il campo [Parole giuste] è vuoto. Si prega di specificare la versione del testo scritto male.</p>
	</div>
	<div id="report-err-99" class="ui-helper-hidden">
		<p>Email sending failed.</p>
	</div>
</div>

<div id="email-form" title="Invio di una e-mail" class="ui-helper-hidden">
	<div id="email-data" class="ui-widget-content ui-corner-all">
		<table align="center" width="100%">
			<tr><td>Il tuo indirizzo (si prega di specificare se si desidera una risposta personale)</td></tr>
			<tr><td><input type="text"  class="ui-state-default ui-input ui-corner-all" id="email-form-address" value=""/></td></tr>
			<tr><td>Soggetto</td></tr>
			<tr><td><input type="text" class="ui-state-default ui-input ui-corner-all" id="email-form-subject" value=""/></td></tr>
			<tr><td>Corpo del messaggio</td></tr>
			<tr><td>
			<textarea id="email-form-body" rows="7" class="ui-state-default ui-input ui-corner-all"></textarea>
			</td></tr>

		</table>
	</div>
	<div id="email-progress">
		<div id="progress-text">Trasmissione del messaggio...</div>
		<div><img src="/images/progress.gif"/></div>
	</div>
	<div id="email-err-0" class="ui-helper-hidden">
		<p>Il tuo messaggio è stato inviato. Grazie.</p>
	</div>
	<div id="email-err-1" class="ui-helper-hidden">
		<p>Error in request: no service.</p>
	</div>
	<div id="email-err-2" class="ui-helper-hidden">
		<p>Error in request: unknown service.</p>
	</div>
	<div id="email-err-3" class="ui-helper-hidden">
		<p>Error in request: obligatory params missing.</p>
	</div>
	<div id="email-err-4" class="ui-helper-hidden">
		<p>Non c'è nulla da inviare ... Si prega di compilare almeno uno dei campi [Soggetto] o [Corpo del messaggio].</p>
	</div>
	<div id="email-err-99" class="ui-helper-hidden">
		<p>Email sending failed.</p>
	</div>
</div>

<div id="changelog-dialog" title="Registro delle modifiche" style="display: none">
	<div id="changelog-dlg-body" class="ui-dialog-content ui-widget-content">
		<div id="changelog-dlg-info">
			Ciao a tutti. Abbiamo cambiato qualcosa dalla tua ultima visita.			<div class="small-spacer">&nbsp;</div>
			<table id="changelog-tbl" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
				<tr>
					<th>Date</th>
					<th>Modifica descrizione</th>
				</tr>
			</table>
			<div class="small-spacer">&nbsp;</div>
			<div id="changelog-link-div" class="ui-state-active changelog" style="float:right;">
				<a id="changelog-link" href="#" onclick="requestAndShowChangelog(-1);">Carica registro completo delle modifiche</a>
			</div>
		</div>
	</div>
</div>


</td>
<td id="vtablec">
<table id="topbar" cellpadding="4" cellspacing="0" border="0"><tr>
<td width="100%">&nbsp;</td>
<td id="vtablet"><script type="text/javascript">
    let theme = { value: 'light', validate: function(key, val) { return val; } };
    loadFromCookie('theme', theme);
    if (!theme) {
        saveToCookie('theme', theme);
    }
</script>

<table cellpadding="0" cellspacing="0" border="0">
    <tr>
        <td>
            <input id="cb-light-theme" type="checkbox" name="light-theme" class="ui-state-default ui-corner-all ui-input ui-input-margin"/>
        </td>
        <td>&nbsp;</td>
        <td>
            <div id="light-toggle" class="ui-state-default ui-corner-all" >
                <span class="ui-icon ui-icon-lightbulb"></span>
            </div>
        </td>
    </tr>
</table>
</td>
<td>&nbsp;</td>
<td id="vtablel"><script type="text/javascript">
function getCoord(el, prop) {
	var c = el[prop], b = document.body;
	while ((el = el.offsetParent)) {
			c += el[prop];
	}
	return c;
}

function showLangsMenu(event) {
	var optsEl = document.getElementById('langs-options');
	var stubEl = document.getElementById('lang-options-stub');
	var menuEl = document.getElementById('langs-menu');
	
	if (window.getComputedStyle(optsEl).display === 'none') {
		var el = event.currentTarget || event.srcElement;
		var left = getCoord(menuEl, 'offsetLeft');
		var top = getCoord(menuEl, 'offsetTop') + menuEl.offsetHeight;
		
		optsEl.style.left = left + 'px';
		stubEl.style.left = left + 'px';
		optsEl.style.top = top + 'px';
		stubEl.style.top = (top - 3) + 'px';
		
		stubEl.style.display = 'block';
		optsEl.style.display = 'block';
	} else {
		optsEl.style.display = 'none';
		stubEl.style.display = 'none';
	}
}

function hideLangsMenu(event) {
	var optsEl = document.getElementById('langs-options');
	var stubEl = document.getElementById('lang-options-stub');
	var menuEl = document.getElementById('langs-menu');
	
	if (window.getComputedStyle(optsEl).display === 'none')
		return;
	
	var x = event.pageX || event.x;
	var y = event.pageY || event.y;
	var el = event.currentTarget || event.srcElement;
	var menuLeft = getCoord(optsEl, 'offsetLeft');
	var menuRight = menuLeft + optsEl.offsetWidth;
	var menuTop = getCoord(menuEl, 'offsetTop');
	var menuBottom = menuTop + menuEl.offsetHeight + optsEl.offsetHeight;
	
	if (x < menuLeft || x > menuRight || y < menuTop || y > menuBottom) {
		optsEl.style.display = 'none';
		stubEl.style.display = 'none';
	}
}

document.addEventListener('DOMContentLoaded', function() {
	document.body.addEventListener('click', hideLangsMenu);
});

</script>

<div id="langs-menu" class="ui-state-default ui-input ui-corner-all" onclick="showLangsMenu(event);">
	<table>
		<tr>
			<td><img src="/images/langs/it.jpg" alt="it"/></td>
			<td>Italiano</td>
		</tr>
	</table>
</div>
<div id="lang-options-stub" class="ui-state-default ui-input"></div>
<div id="langs-options">
	<div>
		<a class="ui-state-active " href="/en/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/en.jpg" alt="en"/></td>
					<td>English (GB)</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/us/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/us.jpg" alt="us"/></td>
					<td>English (US)</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/ru/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/ru.jpg" alt="ru"/></td>
					<td>Русский</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/de/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/de.jpg" alt="de"/></td>
					<td>Deutsch</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/pl/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/pl.jpg" alt="pl"/></td>
					<td>Polski</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/es/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/es.jpg" alt="es"/></td>
					<td>Español</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/fr/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/fr.jpg" alt="fr"/></td>
					<td>Français</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/it/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/it.jpg" alt="it"/></td>
					<td>Italiano</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/nl/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/nl.jpg" alt="nl"/></td>
					<td>Nederlands</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/sk/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/sk.jpg" alt="sk"/></td>
					<td>Slovenčina</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/tr/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/tr.jpg" alt="tr"/></td>
					<td>Türkçe</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active " href="/pt/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/pt.jpg" alt="pt"/></td>
					<td>Português</td>
				</tr>
			</table>
		</a>
	</div>
		<div>
		<a class="ui-state-active last-option" href="/bs/ogame/calc/lfcosts.php">
			<table>
				<tr>
					<td><img src="/images/langs/bs.jpg" alt="bs"/></td>
					<td>Bosnian</td>
				</tr>
			</table>
		</a>
	</div>
	</div>
</td>
</tr></table>
<div id="lfcosts">
	<div class="ui-widget-content ui-corner-all">
		<div id="reset" class="ui-state-error ui-corner-all" title="Reset"><span class="ui-icon ui-icon-arrowrefresh-1-w"></span></div>
		<div class="ui-widget-header ui-corner-all c-ui-main-header">OGame - Calcolatore di Costi per le forme di vita</div>
		<div>
			<div id="general-settings-panel" class="ui-widget-content c-ui-widget-content ui-corner-all ui-panel">
				<div id="general-settings">
					<table cellpadding="2" cellspacing="0" border="0" align="center">
						<tr>
							<td><label for="robot-factory-level">Fabbrica dei Robots</label></td>
							<td><input id="robot-factory-level" type="text" name="robot-factory-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
							<td><label for="nanite-factory-level">Fabbrica dei Naniti</label></td>
							<td><input id="nanite-factory-level" type="text" name="nanite-factory-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
							<td><label for="universe-speed">Universo velocità</label></td>
							<td>
								<select id="universe-speed" name="universe-speed" class="ui-state-default ui-corner-all ui-input ui-input-margin">
									<option value="1" selected="selected">1</option>
									<option value="2">2</option>
									<option value="3">3</option>
									<option value="4">4</option>
									<option value="5">5</option>
									<option value="6">6</option>
									<option value="7">7</option>
									<option value="8">8</option>
									<option value="9">9</option>
									<option value="10">10</option>
								</select>
							</td>
						</tr>
						<tr>
							<td><label for="ion-tech-level">Tecnologia Ionica</label></td>
							<td><input id="ion-tech-level" type="text" name="ion-tech-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
							<td><label for="hyper-tech-level">Tecnologia Iperspaziale </label></td>
							<td><input id="hyper-tech-level" type="text" name="hyper-tech-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
							<td conspan="2"><input id="full-numbers" type="checkbox" name="full-numbers" class="ui-state-default ui-corner-all ui-input ui-input-margin"/><label for="full-numbers">Numeri completi</label></td>
						</tr>
						<tr>
							<td colspan="4">
								<table cellpadding="2" cellspacing="0" border="0" align="center">
									<tr>
										<td><label>Class:</label></td>
										<td><input id="class-0" type="radio" name="class" value="0" tabindex="1"/><label for="class-0">Collector</label></td>
										<td><input id="class-1" type="radio" name="class" value="1" tabindex="2"/><label for="class-1">General</label></td>
										<td><input id="class-2" type="radio" name="class" value="2" tabindex="3"/><label for="class-2">Discoverer</label></td>
									</tr>
								</table>
							</td>
							<td colspan="2">
								<table cellpadding="2" cellspacing="0" border="0" align="center">
									<tr>
										<td><label for="race-selector">Forma di vita</label></td>
										<td>
											<select id="race-selector" name="race-selector" class="ui-state-default ui-corner-all ui-input ui-input-margin">
																							<option value="1" selected="selected">Umani												</option>
																							<option value="2" >Rock'tal												</option>
																							<option value="3" >Mecha												</option>
																							<option value="4" >Kaelesh												</option>
																						</select>
										</td>
									</tr>
								</table>
							</td>							
						</tr>
						</table>
						<table cellpadding="2" cellspacing="0" border="0" align="center">
							<tr>
								<td><label id="lbl-megalith-level" for="megalith-level">Monolite</label></td>
								<td><input id="megalith-level" type="text" name="megalith-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
								<td><label id="lbl-mrc-level" for="mrc-level">Centro di Mineralogia</label></td>
								<td><input id="mrc-level" type="text" name="mrc-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
								<td>Aumento della capacità di carico (%): </td>
								<td><label for="sc-capacity-increase">CL</label></td>
								<td><input id="sc-capacity-increase" type="text" name="sc-capacity-increase" class="ui-state-default ui-corner-all ui-input fleet-input ui-input-margin" value="0" /></td>
								<td><label for="lc-capacity-increase">CP</label></td>
								<td><input id="lc-capacity-increase" type="text" name="lc-capacity-increase" class="ui-state-default ui-corner-all ui-input fleet-input ui-input-margin" value="0" /></td>
							</tr>
						</table>
						<table cellpadding="2" cellspacing="0" border="0" align="center">
							<tr>
								<td><label for="research-cost-reduction">Riduzione dei costi di ricerca %</label></td>
								<td><input id="research-cost-reduction" type="text" name="research-cost-reduction" class="ui-state-default ui-corner-all ui-input fleet-input ui-input-margin" value="0" /></td>
								<td><span class="ui-icon ui-icon-help" title="Si prega di leggere la nota in fondo alla pagina"></span></td>
								<td><label for="research-time-reduction">Riduzione del tempo di ricerca %</label></td>
								<td><input id="research-time-reduction" type="text" name="research-time-reduction" class="ui-state-default ui-corner-all ui-input fleet-input ui-input-margin" value="0" /></td>
								<td><span class="ui-icon ui-icon-help" title="Si prega di leggere la nota in fondo alla pagina"></span></td>
							</tr>
						</table>
				</div>
			</div>
			<div id="tabs">
				<ul>
									<li><a id="tabtag-0" href="#tab-0">Tutti gli articoli - di un livello</a></li>
									<li><a id="tabtag-1" href="#tab-1">Tutti gli articoli - livelli multipli</a></li>
									<li><a id="tabtag-2" href="#tab-2">Un articolo - piu livelli</a></li>
								</ul>
									<div id="tab-0" class="ui-panel no-mp">
											<div id="tabs-0" class="no-mp">
							<ul>
																						<li><a id="tabtag-0-1" href="#tab-0-1">Edifici</a></li>
															<li><a id="tabtag-0-2" href="#tab-0-2">Ricerche</a></li>
														</ul>
																					<div id="tab-0-1" class="ui-panel no-mp">
								<table id="table-0-1" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
									<tr>
										<th style="display: none;"></th>
																				<th >
																							Edificio																					</th>
																				<th align="center">
																							Livello																					</th>
																				<th align="center">
																							Metallo																					</th>
																				<th align="center">
																							Cristallo																					</th>
																				<th align="center">
																							Deuterio																					</th>
																				<th align="center">
																							Energia																					</th>
																				<th align="center">
																							Tempo																					</th>
																				<th align="center">
																							Punti																					</th>
																				<th align="center">
																							<abbr title="Il costo di un'accelerazione per la Materia Oscura.
Edifici e ricerche sono calcolati separatamente,
piedi e difese - per il tempo totale di una scheda.">MO</abbr>
																					</th>
																			</tr>
																												<tr class="odd">
											<td style="display: none;">1001</td>
											<td class="min">Zona residenziale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1002</td>
											<td class="min">Fattoria della Biosfera</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1003</td>
											<td class="min">Centro di Ricerca</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1004</td>
											<td class="min">Accademia delle Scienze</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1005</td>
											<td class="min">Centro di Neuro-calibrazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1006</td>
											<td class="min">Fusione ad alta energia</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1007</td>
											<td class="min">Magazzino Alimentare</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1008</td>
											<td class="min">Tecniche estrattive a fusione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1009</td>
											<td class="min">Grattacielo</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1010</td>
											<td class="min">Laboratorio Biotecnologico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1011</td>
											<td class="min">Metropolis</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1012</td>
											<td class="min">Scudo planetario</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2001</td>
											<td class="min">Enclave di Meditazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2002</td>
											<td class="min">Produzione di cristalli</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2003</td>
											<td class="min">Tecnologicus Runarum</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2004</td>
											<td class="min">Fucina delle Rune</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2005</td>
											<td class="min">Orictorium</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2006</td>
											<td class="min">Fusione magmatica</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2007</td>
											<td class="min">Camera di Disgregazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2008</td>
											<td class="min">Monolite</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2009</td>
											<td class="min">Cristalleria</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2010</td>
											<td class="min">Sintonizzatore di deuterio</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2011</td>
											<td class="min">Centro di Mineralogia</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2012</td>
											<td class="min">Impianto di Riciclaggio</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3001</td>
											<td class="min">Linea di produzione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3002</td>
											<td class="min">Fabbrica Celle a fusione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3003</td>
											<td class="min">Centro Ricerca Robotica</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3004</td>
											<td class="min">Network Aggiornamento</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3005</td>
											<td class="min">Centro Calcolo Quantistico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3006</td>
											<td class="min">Centro Assemblaggio Automatizzato</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3007</td>
											<td class="min">Trasformatore ad alta potenza</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3008</td>
											<td class="min">Linea di produzione Micochip</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3009</td>
											<td class="min">Sala Catena di Montaggio</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3010</td>
											<td class="min">Sintetizzatore Alte prestazioni</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3011</td>
											<td class="min">Produzione di massa di chip</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3012</td>
											<td class="min">Nanobot Riparazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4001</td>
											<td class="min">Rifugio</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4002</td>
											<td class="min">Condensatore Antimateria</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4003</td>
											<td class="min">Camera Vortex</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4004</td>
											<td class="min">Sale della Conoscenza</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4005</td>
											<td class="min">Forum della Trascendenza</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4006</td>
											<td class="min">Convettore Antimateria</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4007</td>
											<td class="min">Laboratorio Clonazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4008</td>
											<td class="min">Acceleratore Crisalide</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4009</td>
											<td class="min">Biomodificatore</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4010</td>
											<td class="min">Modulatore psionico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4011</td>
											<td class="min">Sala Fabbricazione Navi</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4012</td>
											<td class="min">Soprarifrattore</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																		<tr>
										<td style="display: none;">t</td>
										<td colspan="1" class="border-n" >Totale</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n border-s border-w" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
																				<td align="center" class="border-n border-s" ><b>0</b></td>
																				<td align="center" class="border-n border-s border-e" ><b>0</b></td>
									</tr>
									<tr><td colspan="9" height=5px;>&nbsp;</td></tr>
									<tr>
										<td style="display: none;">gt</td>
										<td colspan="2" class="border-n border-w" >Totale generale</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
																				<td align="center" class="border-n" ><b>0</b></td>
																				<td align="center" class="border-n border-e" >0</td>
									</tr>
									<tr>
										<td style="display: none;">ra</td>
										<td colspan="2" class="border-w">Risorse disponibili</td>
										<td align="center"><input id="metal-available-0-1" type="text" name="metal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="crystal-available-0-1" type="text" name="crystal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="deut-available-0-1" type="text" name="deut-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td></td>
										<td></td>
																				<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">dlv</td>
										<td colspan="2" class="border-w">Risorse mancanti</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td></td>
										<td></td>
																				<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">gtt</td>
										<td class="border-s border-w" >Carichi necessari</td>
										<td align="center" class="border-s" >0 CL</td>
										<td align="center" class="border-s" >0 CP</td>
										<td colspan="5" align="center" class="border-s" >&nbsp;</td>
										<td align="center" class="border-s border-e" >&nbsp;</td>
									</tr>
								</table>
							</div>
																					<div id="tab-0-2" class="ui-panel no-mp">
								<table id="table-0-2" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
									<tr>
										<th style="display: none;"></th>
																				<th >
																							Ricerca																					</th>
																				<th align="center">
																							Livello																					</th>
																				<th align="center">
																							Metallo																					</th>
																				<th align="center">
																							Cristallo																					</th>
																				<th align="center">
																							Deuterio																					</th>
																				<th align="center">
																							Energia																					</th>
																				<th align="center">
																							Tempo																					</th>
																				<th align="center">
																							Punti																					</th>
																				<th align="center">
																							<abbr title="Il costo di un'accelerazione per la Materia Oscura.
Edifici e ricerche sono calcolati separatamente,
piedi e difese - per il tempo totale di una scheda.">MO</abbr>
																					</th>
																			</tr>
																												<tr class="odd">
											<td style="display: none;">1101</td>
											<td class="min">Ambasciatori intergalattici</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1102</td>
											<td class="min">Estrattori ad alto rendimento</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1103</td>
											<td class="min">Propulsore a fusione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1104</td>
											<td class="min">Generatore di campo mimetico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1105</td>
											<td class="min">Nascondiglio Orbitale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1106</td>
											<td class="min">AI di ricerca</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1107</td>
											<td class="min">Terraformer ad alte prestazioni</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1108</td>
											<td class="min">Tecnologie di estrazione migliorate</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1109</td>
											<td class="min">Caccia leggero mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1110</td>
											<td class="min">Incrociatore mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1111</td>
											<td class="min">Tecnologia di laboratorio migliorata</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1112</td>
											<td class="min">Terraformer al plasma</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1113</td>
											<td class="min">Propulsori a bassa temperatura</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1114</td>
											<td class="min">Bombardiere mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1115</td>
											<td class="min">Corazzata mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1116</td>
											<td class="min">Incrociatore da battaglia mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1117</td>
											<td class="min">Assistenti robot</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1118</td>
											<td class="min">Supercomputer</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2101</td>
											<td class="min">Batterie vulcaniche</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2102</td>
											<td class="min">Sondaggio acustico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2103</td>
											<td class="min">Sistemi di pompaggio ad alta energia</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2104</td>
											<td class="min">Espansione stiva (navi civili)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2105</td>
											<td class="min">Tecniche estrattive magmatiche</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2106</td>
											<td class="min">Centrali Geotermoelettriche</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2107</td>
											<td class="min">Sondaggio da alte profondità</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2108</td>
											<td class="min">Potenziamento da cristallo ionico (Caccia pesante)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2109</td>
											<td class="min">Concentratore astrale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2110</td>
											<td class="min">Punte di diamante irrobustite</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2111</td>
											<td class="min">Tecnologie minerarie sismiche</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2112</td>
											<td class="min">Sistema di pompaggio al magma</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2113</td>
											<td class="min">Moduli Cristalli ionici</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2114</td>
											<td class="min">Costruzione Base ottimizzata</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2115</td>
											<td class="min">Trasmettitore energetico Diamante</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2116</td>
											<td class="min">Miglioramento Scudo ossidiana</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2117</td>
											<td class="min">Scudi runici</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2118</td>
											<td class="min">Potenziamento Collezionista Rock`tal</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3101</td>
											<td class="min">Tecnologia Catalizzatore</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3102</td>
											<td class="min">Unità al plasma</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3103</td>
											<td class="min">Modulo Efficienza</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3104</td>
											<td class="min">IA deposito</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3105</td>
											<td class="min">Revisione generale (Caccia leggero)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3106</td>
											<td class="min">Linee di trasporto automatizzate</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3107</td>
											<td class="min">IA Droni migliorata</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3108</td>
											<td class="min">Tecnica sperimentale Rigenerazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3109</td>
											<td class="min">Revisione generale (Incrociatore)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3110</td>
											<td class="min">Pilota automatico Slingshot</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3111</td>
											<td class="min">Superconduttore Alta temperatura</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3112</td>
											<td class="min">Revisione generale (Nave da battaglia)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3113</td>
											<td class="min">Intelligenza collettiva artificiale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3114</td>
											<td class="min">Revisione generale (Incrociatore da battaglia)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3115</td>
											<td class="min">Revisione generale (Bombardiere)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3116</td>
											<td class="min">Revisione generale (Corazzata)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3117</td>
											<td class="min">Tecnologia Armi sperimentale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3118</td>
											<td class="min">Rinforzo generale Mecha</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4101</td>
											<td class="min">Recupero calore</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4102</td>
											<td class="min">Tecnologia Processo al solfuro</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4103</td>
											<td class="min">Network psionico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4104</td>
											<td class="min">Raggio di trazione telecinetico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4105</td>
											<td class="min">Tecnologia Sensori migliorata</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4106</td>
											<td class="min">Compattatore neuromodulare</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4107</td>
											<td class="min">Interfaccia neurologica</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4108</td>
											<td class="min">Network di analisi superglobale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4109</td>
											<td class="min">Overclocking (Caccia pesante)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4110</td>
											<td class="min">Sistema Potenziamento telecinetico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4111</td>
											<td class="min">Sesto senso</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4112</td>
											<td class="min">Armonizzatore psicologico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4113</td>
											<td class="min">Intelligenza collettiva efficiente</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4114</td>
											<td class="min">Overclocking (Cargo pesante)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4115</td>
											<td class="min">Sensori Gravità</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4116</td>
											<td class="min">Overclocking (Nave da battaglia)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4117</td>
											<td class="min">Matrice Protezione psionica</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4118</td>
											<td class="min">Rinforzo Esploratore Kaelesh</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																							<td align="center">0</td>
																					</tr>
																		<tr>
										<td style="display: none;">t</td>
										<td colspan="1" class="border-n" >Totale</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n border-s border-w" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
																				<td align="center" class="border-n border-s" ><b>0</b></td>
																				<td align="center" class="border-n border-s border-e" ><b>0</b></td>
									</tr>
									<tr><td colspan="9" height=5px;>&nbsp;</td></tr>
									<tr>
										<td style="display: none;">gt</td>
										<td colspan="2" class="border-n border-w" >Totale generale</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
																				<td align="center" class="border-n" ><b>0</b></td>
																				<td align="center" class="border-n border-e" >0</td>
									</tr>
									<tr>
										<td style="display: none;">ra</td>
										<td colspan="2" class="border-w">Risorse disponibili</td>
										<td align="center"><input id="metal-available-0-2" type="text" name="metal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="crystal-available-0-2" type="text" name="crystal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="deut-available-0-2" type="text" name="deut-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td></td>
										<td></td>
																				<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">dlv</td>
										<td colspan="2" class="border-w">Risorse mancanti</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td></td>
										<td></td>
																				<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">gtt</td>
										<td class="border-s border-w" >Carichi necessari</td>
										<td align="center" class="border-s" >0 CL</td>
										<td align="center" class="border-s" >0 CP</td>
										<td colspan="5" align="center" class="border-s" >&nbsp;</td>
										<td align="center" class="border-s border-e" >&nbsp;</td>
									</tr>
								</table>
							</div>
													</div>
										</div>
									<div id="tab-1" class="ui-panel no-mp">
											<div id="tabs-1" class="no-mp">
							<ul>
																						<li><a id="tabtag-1-1" href="#tab-1-1">Edifici</a></li>
															<li><a id="tabtag-1-2" href="#tab-1-2">Ricerche</a></li>
														</ul>
																					<div id="tab-1-1" class="ui-panel no-mp">
								<table id="table-1-1" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
									<tr>
										<th style="display: none;"></th>
																				<th >
																							Edificio																					</th>
																				<th align="center">
																							Dal livello																					</th>
																				<th align="center">
																							A livello																					</th>
																				<th align="center">
																							Metallo																					</th>
																				<th align="center">
																							Cristallo																					</th>
																				<th align="center">
																							Deuterio																					</th>
																				<th align="center">
																							Energia																					</th>
																				<th align="center">
																							Tempo																					</th>
																				<th align="center">
																							Punti																					</th>
																			</tr>
																												<tr class="odd">
											<td style="display: none;">1001</td>
											<td class="min">Zona residenziale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1002</td>
											<td class="min">Fattoria della Biosfera</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1003</td>
											<td class="min">Centro di Ricerca</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1004</td>
											<td class="min">Accademia delle Scienze</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1005</td>
											<td class="min">Centro di Neuro-calibrazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1006</td>
											<td class="min">Fusione ad alta energia</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1007</td>
											<td class="min">Magazzino Alimentare</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1008</td>
											<td class="min">Tecniche estrattive a fusione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1009</td>
											<td class="min">Grattacielo</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1010</td>
											<td class="min">Laboratorio Biotecnologico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1011</td>
											<td class="min">Metropolis</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1012</td>
											<td class="min">Scudo planetario</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2001</td>
											<td class="min">Enclave di Meditazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2002</td>
											<td class="min">Produzione di cristalli</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2003</td>
											<td class="min">Tecnologicus Runarum</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2004</td>
											<td class="min">Fucina delle Rune</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2005</td>
											<td class="min">Orictorium</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2006</td>
											<td class="min">Fusione magmatica</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2007</td>
											<td class="min">Camera di Disgregazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2008</td>
											<td class="min">Monolite</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2009</td>
											<td class="min">Cristalleria</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2010</td>
											<td class="min">Sintonizzatore di deuterio</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2011</td>
											<td class="min">Centro di Mineralogia</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2012</td>
											<td class="min">Impianto di Riciclaggio</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3001</td>
											<td class="min">Linea di produzione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3002</td>
											<td class="min">Fabbrica Celle a fusione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3003</td>
											<td class="min">Centro Ricerca Robotica</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3004</td>
											<td class="min">Network Aggiornamento</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3005</td>
											<td class="min">Centro Calcolo Quantistico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3006</td>
											<td class="min">Centro Assemblaggio Automatizzato</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3007</td>
											<td class="min">Trasformatore ad alta potenza</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3008</td>
											<td class="min">Linea di produzione Micochip</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3009</td>
											<td class="min">Sala Catena di Montaggio</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3010</td>
											<td class="min">Sintetizzatore Alte prestazioni</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3011</td>
											<td class="min">Produzione di massa di chip</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3012</td>
											<td class="min">Nanobot Riparazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4001</td>
											<td class="min">Rifugio</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4002</td>
											<td class="min">Condensatore Antimateria</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4003</td>
											<td class="min">Camera Vortex</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4004</td>
											<td class="min">Sale della Conoscenza</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4005</td>
											<td class="min">Forum della Trascendenza</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4006</td>
											<td class="min">Convettore Antimateria</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4007</td>
											<td class="min">Laboratorio Clonazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4008</td>
											<td class="min">Acceleratore Crisalide</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4009</td>
											<td class="min">Biomodificatore</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4010</td>
											<td class="min">Modulatore psionico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4011</td>
											<td class="min">Sala Fabbricazione Navi</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4012</td>
											<td class="min">Soprarifrattore</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																		<tr>
										<td style="display: none;">t</td>
										<td colspan="2" class="border-n" >Totale</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n border-s border-w" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
																				<td align="center" class="border-n border-s border-e" ><b>0</b></td>
									</tr>
									<tr><td colspan="10" height=5px;>&nbsp;</td></tr>
									<tr>
										<td style="display: none;">gt</td>
										<td colspan="3" class="border-n border-w" >Totale generale</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
																				<td align="center" class="border-n border-e" >0</td>
									</tr>
									<tr>
										<td style="display: none;">ra</td>
										<td colspan="3" class="border-w">Risorse disponibili</td>
										<td align="center"><input id="metal-available-1-1" type="text" name="metal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="crystal-available-1-1" type="text" name="crystal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="deut-available-1-1" type="text" name="deut-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td></td>
										<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">dlv</td>
										<td colspan="3" class="border-w">Risorse mancanti</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td></td>
										<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">gtt</td>
										<td class="border-s border-w" >Carichi necessari</td>
										<td align="center" class="border-s" >0 CL</td>
										<td align="center" class="border-s" >0 CP</td>
										<td colspan="5" align="center" class="border-s" >&nbsp;</td>
										<td align="center" class="border-s border-e" >&nbsp;</td>
									</tr>
								</table>
							</div>
																					<div id="tab-1-2" class="ui-panel no-mp">
								<table id="table-1-2" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
									<tr>
										<th style="display: none;"></th>
																				<th >
																							Ricerca																					</th>
																				<th align="center">
																							Dal livello																					</th>
																				<th align="center">
																							A livello																					</th>
																				<th align="center">
																							Metallo																					</th>
																				<th align="center">
																							Cristallo																					</th>
																				<th align="center">
																							Deuterio																					</th>
																				<th align="center">
																							Energia																					</th>
																				<th align="center">
																							Tempo																					</th>
																				<th align="center">
																							Punti																					</th>
																			</tr>
																												<tr class="odd">
											<td style="display: none;">1101</td>
											<td class="min">Ambasciatori intergalattici</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1102</td>
											<td class="min">Estrattori ad alto rendimento</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1103</td>
											<td class="min">Propulsore a fusione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1104</td>
											<td class="min">Generatore di campo mimetico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1105</td>
											<td class="min">Nascondiglio Orbitale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1106</td>
											<td class="min">AI di ricerca</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1107</td>
											<td class="min">Terraformer ad alte prestazioni</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1108</td>
											<td class="min">Tecnologie di estrazione migliorate</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1109</td>
											<td class="min">Caccia leggero mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1110</td>
											<td class="min">Incrociatore mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1111</td>
											<td class="min">Tecnologia di laboratorio migliorata</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1112</td>
											<td class="min">Terraformer al plasma</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1113</td>
											<td class="min">Propulsori a bassa temperatura</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1114</td>
											<td class="min">Bombardiere mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1115</td>
											<td class="min">Corazzata mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1116</td>
											<td class="min">Incrociatore da battaglia mk II</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">1117</td>
											<td class="min">Assistenti robot</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">1118</td>
											<td class="min">Supercomputer</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2101</td>
											<td class="min">Batterie vulcaniche</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2102</td>
											<td class="min">Sondaggio acustico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2103</td>
											<td class="min">Sistemi di pompaggio ad alta energia</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2104</td>
											<td class="min">Espansione stiva (navi civili)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2105</td>
											<td class="min">Tecniche estrattive magmatiche</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2106</td>
											<td class="min">Centrali Geotermoelettriche</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2107</td>
											<td class="min">Sondaggio da alte profondità</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2108</td>
											<td class="min">Potenziamento da cristallo ionico (Caccia pesante)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2109</td>
											<td class="min">Concentratore astrale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2110</td>
											<td class="min">Punte di diamante irrobustite</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2111</td>
											<td class="min">Tecnologie minerarie sismiche</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2112</td>
											<td class="min">Sistema di pompaggio al magma</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2113</td>
											<td class="min">Moduli Cristalli ionici</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2114</td>
											<td class="min">Costruzione Base ottimizzata</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2115</td>
											<td class="min">Trasmettitore energetico Diamante</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2116</td>
											<td class="min">Miglioramento Scudo ossidiana</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">2117</td>
											<td class="min">Scudi runici</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">2118</td>
											<td class="min">Potenziamento Collezionista Rock`tal</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3101</td>
											<td class="min">Tecnologia Catalizzatore</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3102</td>
											<td class="min">Unità al plasma</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3103</td>
											<td class="min">Modulo Efficienza</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3104</td>
											<td class="min">IA deposito</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3105</td>
											<td class="min">Revisione generale (Caccia leggero)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3106</td>
											<td class="min">Linee di trasporto automatizzate</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3107</td>
											<td class="min">IA Droni migliorata</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3108</td>
											<td class="min">Tecnica sperimentale Rigenerazione</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3109</td>
											<td class="min">Revisione generale (Incrociatore)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3110</td>
											<td class="min">Pilota automatico Slingshot</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3111</td>
											<td class="min">Superconduttore Alta temperatura</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3112</td>
											<td class="min">Revisione generale (Nave da battaglia)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3113</td>
											<td class="min">Intelligenza collettiva artificiale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3114</td>
											<td class="min">Revisione generale (Incrociatore da battaglia)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3115</td>
											<td class="min">Revisione generale (Bombardiere)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3116</td>
											<td class="min">Revisione generale (Corazzata)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">3117</td>
											<td class="min">Tecnologia Armi sperimentale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">3118</td>
											<td class="min">Rinforzo generale Mecha</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4101</td>
											<td class="min">Recupero calore</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4102</td>
											<td class="min">Tecnologia Processo al solfuro</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4103</td>
											<td class="min">Network psionico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4104</td>
											<td class="min">Raggio di trazione telecinetico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4105</td>
											<td class="min">Tecnologia Sensori migliorata</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4106</td>
											<td class="min">Compattatore neuromodulare</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4107</td>
											<td class="min">Interfaccia neurologica</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4108</td>
											<td class="min">Network di analisi superglobale</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4109</td>
											<td class="min">Overclocking (Caccia pesante)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4110</td>
											<td class="min">Sistema Potenziamento telecinetico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4111</td>
											<td class="min">Sesto senso</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4112</td>
											<td class="min">Armonizzatore psicologico</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4113</td>
											<td class="min">Intelligenza collettiva efficiente</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4114</td>
											<td class="min">Overclocking (Cargo pesante)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4115</td>
											<td class="min">Sensori Gravità</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4116</td>
											<td class="min">Overclocking (Nave da battaglia)</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="odd">
											<td style="display: none;">4117</td>
											<td class="min">Matrice Protezione psionica</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																			<tr class="even">
											<td style="display: none;">4118</td>
											<td class="min">Rinforzo Esploratore Kaelesh</td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
																						<td align="center"><input type="text" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0</td>
											<td align="center">0s</td>
											<td align="center">0</td>
																					</tr>
																		<tr>
										<td style="display: none;">t</td>
										<td colspan="2" class="border-n" >Totale</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n border-s border-w" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
										<td align="center" class="border-n border-s" ><b>0</b></td>
																				<td align="center" class="border-n border-s border-e" ><b>0</b></td>
									</tr>
									<tr><td colspan="10" height=5px;>&nbsp;</td></tr>
									<tr>
										<td style="display: none;">gt</td>
										<td colspan="3" class="border-n border-w" >Totale generale</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
																				<td align="center" class="border-n border-e" >0</td>
									</tr>
									<tr>
										<td style="display: none;">ra</td>
										<td colspan="3" class="border-w">Risorse disponibili</td>
										<td align="center"><input id="metal-available-1-2" type="text" name="metal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="crystal-available-1-2" type="text" name="crystal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="deut-available-1-2" type="text" name="deut-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td></td>
										<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">dlv</td>
										<td colspan="3" class="border-w">Risorse mancanti</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td></td>
										<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">gtt</td>
										<td class="border-s border-w" >Carichi necessari</td>
										<td align="center" class="border-s" >0 CL</td>
										<td align="center" class="border-s" >0 CP</td>
										<td colspan="5" align="center" class="border-s" >&nbsp;</td>
										<td align="center" class="border-s border-e" >&nbsp;</td>
									</tr>
								</table>
							</div>
													</div>
										</div>
									<div id="tab-2" class="ui-panel no-mp">
											<div>
							<table cellpadding="0" cellspacing="1" border="0" >
								<tr>
									<td colspan="4">
									<select id="tech-types-select" name="tech-types-select" class="ui-state-default ui-corner-all ui-input">
																												<optgroup label="Edifici">
																															<option value="1001" >Zona residenziale</option>
																					<option value="1002" >Fattoria della Biosfera</option>
																					<option value="1003" >Centro di Ricerca</option>
																					<option value="1004" >Accademia delle Scienze</option>
																					<option value="1005" >Centro di Neuro-calibrazione</option>
																					<option value="1006" >Fusione ad alta energia</option>
																					<option value="1007" >Magazzino Alimentare</option>
																					<option value="1008" >Tecniche estrattive a fusione</option>
																					<option value="1009" >Grattacielo</option>
																					<option value="1010" >Laboratorio Biotecnologico</option>
																					<option value="1011" >Metropolis</option>
																					<option value="1012" >Scudo planetario</option>
																					<option value="2001" >Enclave di Meditazione</option>
																					<option value="2002" >Produzione di cristalli</option>
																					<option value="2003" >Tecnologicus Runarum</option>
																					<option value="2004" >Fucina delle Rune</option>
																					<option value="2005" >Orictorium</option>
																					<option value="2006" >Fusione magmatica</option>
																					<option value="2007" >Camera di Disgregazione</option>
																					<option value="2008" >Monolite</option>
																					<option value="2009" >Cristalleria</option>
																					<option value="2010" >Sintonizzatore di deuterio</option>
																					<option value="2011" >Centro di Mineralogia</option>
																					<option value="2012" >Impianto di Riciclaggio</option>
																					<option value="3001" >Linea di produzione</option>
																					<option value="3002" >Fabbrica Celle a fusione</option>
																					<option value="3003" >Centro Ricerca Robotica</option>
																					<option value="3004" >Network Aggiornamento</option>
																					<option value="3005" >Centro Calcolo Quantistico</option>
																					<option value="3006" >Centro Assemblaggio Automatizzato</option>
																					<option value="3007" >Trasformatore ad alta potenza</option>
																					<option value="3008" >Linea di produzione Micochip</option>
																					<option value="3009" >Sala Catena di Montaggio</option>
																					<option value="3010" >Sintetizzatore Alte prestazioni</option>
																					<option value="3011" >Produzione di massa di chip</option>
																					<option value="3012" >Nanobot Riparazione</option>
																					<option value="4001" >Rifugio</option>
																					<option value="4002" >Condensatore Antimateria</option>
																					<option value="4003" >Camera Vortex</option>
																					<option value="4004" >Sale della Conoscenza</option>
																					<option value="4005" >Forum della Trascendenza</option>
																					<option value="4006" >Convettore Antimateria</option>
																					<option value="4007" >Laboratorio Clonazione</option>
																					<option value="4008" >Acceleratore Crisalide</option>
																					<option value="4009" >Biomodificatore</option>
																					<option value="4010" >Modulatore psionico</option>
																					<option value="4011" >Sala Fabbricazione Navi</option>
																					<option value="4012" >Soprarifrattore</option>
																				</optgroup>
																			<optgroup label="Ricerche">
																															<option value="1101" >Ambasciatori intergalattici</option>
																					<option value="1102" >Estrattori ad alto rendimento</option>
																					<option value="1103" >Propulsore a fusione</option>
																					<option value="1104" >Generatore di campo mimetico</option>
																					<option value="1105" >Nascondiglio Orbitale</option>
																					<option value="1106" >AI di ricerca</option>
																					<option value="1107" >Terraformer ad alte prestazioni</option>
																					<option value="1108" >Tecnologie di estrazione migliorate</option>
																					<option value="1109" >Caccia leggero mk II</option>
																					<option value="1110" >Incrociatore mk II</option>
																					<option value="1111" >Tecnologia di laboratorio migliorata</option>
																					<option value="1112" >Terraformer al plasma</option>
																					<option value="1113" >Propulsori a bassa temperatura</option>
																					<option value="1114" >Bombardiere mk II</option>
																					<option value="1115" >Corazzata mk II</option>
																					<option value="1116" >Incrociatore da battaglia mk II</option>
																					<option value="1117" >Assistenti robot</option>
																					<option value="1118" >Supercomputer</option>
																					<option value="2101" >Batterie vulcaniche</option>
																					<option value="2102" >Sondaggio acustico</option>
																					<option value="2103" >Sistemi di pompaggio ad alta energia</option>
																					<option value="2104" >Espansione stiva (navi civili)</option>
																					<option value="2105" >Tecniche estrattive magmatiche</option>
																					<option value="2106" >Centrali Geotermoelettriche</option>
																					<option value="2107" >Sondaggio da alte profondità</option>
																					<option value="2108" >Potenziamento da cristallo ionico (Caccia pesante)</option>
																					<option value="2109" >Concentratore astrale</option>
																					<option value="2110" >Punte di diamante irrobustite</option>
																					<option value="2111" >Tecnologie minerarie sismiche</option>
																					<option value="2112" >Sistema di pompaggio al magma</option>
																					<option value="2113" >Moduli Cristalli ionici</option>
																					<option value="2114" >Costruzione Base ottimizzata</option>
																					<option value="2115" >Trasmettitore energetico Diamante</option>
																					<option value="2116" >Miglioramento Scudo ossidiana</option>
																					<option value="2117" >Scudi runici</option>
																					<option value="2118" >Potenziamento Collezionista Rock`tal</option>
																					<option value="3101" >Tecnologia Catalizzatore</option>
																					<option value="3102" >Unità al plasma</option>
																					<option value="3103" >Modulo Efficienza</option>
																					<option value="3104" >IA deposito</option>
																					<option value="3105" >Revisione generale (Caccia leggero)</option>
																					<option value="3106" >Linee di trasporto automatizzate</option>
																					<option value="3107" >IA Droni migliorata</option>
																					<option value="3108" >Tecnica sperimentale Rigenerazione</option>
																					<option value="3109" >Revisione generale (Incrociatore)</option>
																					<option value="3110" >Pilota automatico Slingshot</option>
																					<option value="3111" >Superconduttore Alta temperatura</option>
																					<option value="3112" >Revisione generale (Nave da battaglia)</option>
																					<option value="3113" >Intelligenza collettiva artificiale</option>
																					<option value="3114" >Revisione generale (Incrociatore da battaglia)</option>
																					<option value="3115" >Revisione generale (Bombardiere)</option>
																					<option value="3116" >Revisione generale (Corazzata)</option>
																					<option value="3117" >Tecnologia Armi sperimentale</option>
																					<option value="3118" >Rinforzo generale Mecha</option>
																					<option value="4101" >Recupero calore</option>
																					<option value="4102" >Tecnologia Processo al solfuro</option>
																					<option value="4103" >Network psionico</option>
																					<option value="4104" >Raggio di trazione telecinetico</option>
																					<option value="4105" >Tecnologia Sensori migliorata</option>
																					<option value="4106" >Compattatore neuromodulare</option>
																					<option value="4107" >Interfaccia neurologica</option>
																					<option value="4108" >Network di analisi superglobale</option>
																					<option value="4109" >Overclocking (Caccia pesante)</option>
																					<option value="4110" >Sistema Potenziamento telecinetico</option>
																					<option value="4111" >Sesto senso</option>
																					<option value="4112" >Armonizzatore psicologico</option>
																					<option value="4113" >Intelligenza collettiva efficiente</option>
																					<option value="4114" >Overclocking (Cargo pesante)</option>
																					<option value="4115" >Sensori Gravità</option>
																					<option value="4116" >Overclocking (Nave da battaglia)</option>
																					<option value="4117" >Matrice Protezione psionica</option>
																					<option value="4118" >Rinforzo Esploratore Kaelesh</option>
																				</optgroup>
																			</select>
									</td>
									<td><label for="tab2-from-level">&nbsp;Dal livello</label></td>
									<td><input id="tab2-from-level" type="text" name="tab2-from-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
									<td><label for="tab2-to-level">A livello</label></td>
									<td><input id="tab2-to-level" type="text" name="tab2-to-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
								</tr>
							</table>
						</div>
						<div id="commons-table-div">
							<table id="commons-table" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
								<tr>
																	<th>Livello</th>
																	<th>Metallo</th>
																	<th>Cristallo</th>
																	<th>Deuterio</th>
																	<th>Energia</th>
																	<th>Tempo</th>
																	<th>Punti</th>
																</tr>
								<tr>
									<td colspan="7">&nbsp;</td>
								</tr>
								<tr class="odd">
									<td class="border-n border-w" >Totale</td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n border-e" ><b>0</b></td>
								</tr>
								<tr>
									<td class="border-w">Risorse disponibili</td>
									<td align="center"><input id="metal-available-2-1" type="text" name="metal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
									<td align="center"><input id="crystal-available-2-1" type="text" name="crystal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
									<td align="center"><input id="deut-available-2-1" type="text" name="deut-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
									<td></td>
									<td></td>
									<td class="border-e"></td>
								</tr>
								<tr>
									<td class="border-w">Risorse mancanti</td>
									<td align="center" >0</td>
									<td align="center" >0</td>
									<td align="center" >0</td>
									<td></td>
									<td></td>
									<td class="border-e"></td>
								</tr>
								<tr class="odd">
									<td class="border-s border-w" >Carichi necessari</td>
									<td align="center" class="border-s" >0 CL</td>
									<td align="center" class="border-s">0 CP</td>
									<td colspan="4" class="border-s border-e"></td>
								</tr>
							</table>
						</div>
										</div>
							</div>
		</div>
	</div>
	<div id="warning" class="ui-state-highlight ui-corner-all">
		<div id="warning-message"></div>
	</div>
	<div id="hint" class="ui-corner-all">
		<table >
			<tr>
				<td valign="top">
					<span class="ui-icon ui-icon-info"></span>
				</td>
				<td>
					<span id= "hint-message">Il bonus finale varia da pianeta a pianeta. Per ottenere risultati precisi, calcolate manualmente il bonus totale sul pianeta in cui inizierete la costruzione/ricerca.</span>
				</td>
			</tr>
		</table>
	</div>
</div>

</td>
</tr></table>
<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js', 'ym');

    ym(1942684, 'init', {clickmap:true, accurateTrackBounce:true, trackLinks:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/1942684" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->

</body>
</html>
