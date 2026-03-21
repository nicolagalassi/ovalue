<!DOCTYPE html>
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
	<meta http-equiv="Cache-Control" content="no-cache" />
	<title>OGame - Costs calculator for LifeForms</title>
	<meta name="description" content="OGame - Costs calculator for LifeForms"/>
	<meta name="keywords" content="proxyforgame,proxy,online,calc,calculator,ogame,price calculation,cost calculation,buildings costs,research costs,fleet costs,defence costs,costs calculator,prices calculator,lifeforms"/>
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
		options.decimalSeparator='.';
		options.datetimeW = 'w';
		options.datetimeD = 'd';
		options.datetimeH = 'h';
		options.datetimeM = 'm';
		options.datetimeS = 's';
		options.unitSuffix = 'KMG';
		options.scShort = 'SC';
		options.lcShort = 'LC';
		options.scFull = 'Small cargo';
		options.lcFull = 'Large cargo';
		options.warnindDivId = 'warning';
		options.warnindMsgDivId = 'warning-message';
		options.fieldHint = 'for field [{0}]';
		options.msgMinConstraintViolated = 'Value {0} {1} is less than minimum {2}. Field value set to minimum.';
		options.msgMaxConstraintViolated = 'Value {0} {1} is greater than maximum {2}. Field value set to maximum.';

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
buttonsText.send = 'Send';
buttonsText.cancel = 'Cancel';
buttonsText.correct = 'Lets correct it';
buttonsText.ok = 'OK';
var currUrl = '/en/ogame/calc/lfcosts.php';
let currChange = { value: 44, validate: function(key, val) { return val; } };
var currLang = 'en';
</script>
<script type="text/javascript" src="/js/sidebar.js?v=1765242486"></script>

<div id="sidebar">
	<a class="ui-widget-header" href="/en/">Main page</a>
	<div class="ui-panel">Calculators<br/>for OGame <font size="1">(12)</font></div>
	<div>
						<a class="ui-state-default" href="/en/ogame/calc/trade.php">Trade calculator</a>
								<a class="ui-state-default" href="/en/ogame/calc/costs.php">Costs calculator</a>
								<div class="ui-state-active">Costs calculator (LF)</div>
								<a class="ui-state-default" href="/en/ogame/calc/queue.php">Construction queue</a>
								<a class="ui-state-default" href="/en/ogame/calc/production.php">Production calculator</a>
								<a class="ui-state-default" href="/en/ogame/calc/graviton.php">Graviton calculator</a>
								<a class="ui-state-default" href="/en/ogame/calc/terraformer.php">Terraformer</a>
								<a class="ui-state-default" href="/en/ogame/calc/flight.php">Flight time calculator</a>
								<a class="ui-state-default" href="/en/ogame/calc/moon.php">Moons</a>
								<a class="ui-state-default" href="/en/ogame/calc/expeditions.php">Expeditions</a>
				</div>
	<div class="spacer">&nbsp;</div>
	<div class="ui-panel">Feedback</div>
	<div class="ui-state-active feedback">
		Found an error?<br/>Select the text and press<br/><a href="#" onclick="findSelection();" style="display: inline">Ctrl+Enter</a><br/>to tell us about it.	</div>
	<div class="ui-state-active feedback">
		If you have any requests<br/>or comments, please<br/><a href="#" onclick="showEmailWindow();" style="display: inline">click here</a><br/>to send us an e-mail.	</div>
	<div class="ui-state-active feedback">
		If you can help us<br/>with site translation,<br/>please visit<br/><a href="http://board.origin.ogame.de/board6-origin/board24-localization-area/board153-fan-project-s-translations/1936-online-tools-collection-translation" style="display: inline" target="_blank">OGame Origin Board</a>	</div>
	<div class="ui-state-active feedback">
		Join our<br/><a href="https://discord.gg/H8xPdA9FbE" style="display: inline" target="_blank">Discord server</a>,<br/>to discuss the site,<br/>report a bug,<br/>or make a suggestion.<br/>	</div>
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
		<a href="#" onclick="requestAndShowChangelog(-1);">Changelog</a>
	</div>

</div>

<div id="report-form" title="Sending a misspelling report" class="ui-helper-hidden">
	<div id="report-data" class="ui-widget-content ui-corner-all">
		<div id="report-info">
			To send a misspelling report please specify the misspelled text and your version of it.		</div>
		<table align="center">
			<tr><td>Misspelled text</td></tr>
			<tr><td><input type="text" class="ui-state-default ui-input ui-corner-all correction-input" id="misspelled-text" value=""/></td></tr>
			<tr><td>Corrected text</td></tr>
			<tr><td><input type="text" class="ui-state-default ui-input ui-corner-all correction-input" id="corrected-text" value=""/></td></tr>
		</table>
	</div>
	<div id="report-progress">
		<div id="progress-text">Sending your report...</div>
		<div><img src="/images/progress.gif" alt=""/></div>
	</div>
	<div id="report-err-0" class="ui-helper-hidden">
		<p>Your report has been sent. Thank you.</p>
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
		<p>Both fields are empty. Please specify the misspelled text and your version of it.</p>
	</div>
	<div id="report-err-5" class="ui-helper-hidden">
		<p>The content of field [Corrected text] is identical to the content of field [Misspelled text]. Please specify your version of the misspelled text.</p>
	</div>
	<div id="report-err-6" class="ui-helper-hidden">
		<p>The field [Misspelled text] is empty. Please specify the misspelled text.</p>
	</div>
	<div id="report-err-7" class="ui-helper-hidden">
		<p>The field [Corrected text] is empty. Please specify your version of the misspelled text.</p>
	</div>
	<div id="report-err-99" class="ui-helper-hidden">
		<p>Email sending failed.</p>
	</div>
</div>

<div id="email-form" title="Sending an e-mail" class="ui-helper-hidden">
	<div id="email-data" class="ui-widget-content ui-corner-all">
		<table align="center" width="100%">
			<tr><td>Your address (please specify if you want a personal reply)</td></tr>
			<tr><td><input type="text"  class="ui-state-default ui-input ui-corner-all" id="email-form-address" value=""/></td></tr>
			<tr><td>Subject</td></tr>
			<tr><td><input type="text" class="ui-state-default ui-input ui-corner-all" id="email-form-subject" value=""/></td></tr>
			<tr><td>Message body</td></tr>
			<tr><td>
			<textarea id="email-form-body" rows="7" class="ui-state-default ui-input ui-corner-all"></textarea>
			</td></tr>

		</table>
	</div>
	<div id="email-progress">
		<div id="progress-text">Sending your message...</div>
		<div><img src="/images/progress.gif"/></div>
	</div>
	<div id="email-err-0" class="ui-helper-hidden">
		<p>Your message has been sent. Thank you.</p>
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
		<p>There is nothing to send... Please fill in at least one on the fields [Subject] or [Message body].</p>
	</div>
	<div id="email-err-99" class="ui-helper-hidden">
		<p>Email sending failed.</p>
	</div>
</div>

<div id="changelog-dialog" title="Changelog" style="display: none">
	<div id="changelog-dlg-body" class="ui-dialog-content ui-widget-content">
		<div id="changelog-dlg-info">
			Hi there. We have changed something since your last visit.			<div class="small-spacer">&nbsp;</div>
			<table id="changelog-tbl" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
				<tr>
					<th>Date</th>
					<th>Change description</th>
				</tr>
			</table>
			<div class="small-spacer">&nbsp;</div>
			<div id="changelog-link-div" class="ui-state-active changelog" style="float:right;">
				<a id="changelog-link" href="#" onclick="requestAndShowChangelog(-1);">Load full changelog</a>
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
			<td><img src="/images/langs/en.jpg" alt="en"/></td>
			<td>English (GB)</td>
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
		<div class="ui-widget-header ui-corner-all c-ui-main-header">OGame - Costs calculator for LifeForms</div>
		<div>
			<div id="general-settings-panel" class="ui-widget-content c-ui-widget-content ui-corner-all ui-panel">
				<div id="general-settings">
					<table cellpadding="2" cellspacing="0" border="0" align="center">
						<tr>
							<td><label for="robot-factory-level">Robotics factory</label></td>
							<td><input id="robot-factory-level" type="text" name="robot-factory-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
							<td><label for="nanite-factory-level">Nanite factory</label></td>
							<td><input id="nanite-factory-level" type="text" name="nanite-factory-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
							<td><label for="universe-speed">Universe speed</label></td>
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
							<td><label for="ion-tech-level">Ion technology</label></td>
							<td><input id="ion-tech-level" type="text" name="ion-tech-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
							<td><label for="hyper-tech-level">Hyperspace technology</label></td>
							<td><input id="hyper-tech-level" type="text" name="hyper-tech-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
							<td conspan="2"><input id="full-numbers" type="checkbox" name="full-numbers" class="ui-state-default ui-corner-all ui-input ui-input-margin"/><label for="full-numbers">Full numbers</label></td>
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
										<td><label for="race-selector">Lifeform</label></td>
										<td>
											<select id="race-selector" name="race-selector" class="ui-state-default ui-corner-all ui-input ui-input-margin">
																							<option value="1" selected="selected">Human												</option>
																							<option value="2" >Rock'tal												</option>
																							<option value="3" >Mechas												</option>
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
								<td><label id="lbl-megalith-level" for="megalith-level">Megalith</label></td>
								<td><input id="megalith-level" type="text" name="megalith-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
								<td><label id="lbl-mrc-level" for="mrc-level">Mineral Research Centre</label></td>
								<td><input id="mrc-level" type="text" name="mrc-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0" /></td>
								<td>Cargo capacity increase (%): </td>
								<td><label for="sc-capacity-increase">SC</label></td>
								<td><input id="sc-capacity-increase" type="text" name="sc-capacity-increase" class="ui-state-default ui-corner-all ui-input fleet-input ui-input-margin" value="0" /></td>
								<td><label for="lc-capacity-increase">LC</label></td>
								<td><input id="lc-capacity-increase" type="text" name="lc-capacity-increase" class="ui-state-default ui-corner-all ui-input fleet-input ui-input-margin" value="0" /></td>
							</tr>
						</table>
						<table cellpadding="2" cellspacing="0" border="0" align="center">
							<tr>
								<td><label for="research-cost-reduction">Research cost reduction %</label></td>
								<td><input id="research-cost-reduction" type="text" name="research-cost-reduction" class="ui-state-default ui-corner-all ui-input fleet-input ui-input-margin" value="0" /></td>
								<td><span class="ui-icon ui-icon-help" title="Please read the note at the bottom of the page"></span></td>
								<td><label for="research-time-reduction">Research time reduction %</label></td>
								<td><input id="research-time-reduction" type="text" name="research-time-reduction" class="ui-state-default ui-corner-all ui-input fleet-input ui-input-margin" value="0" /></td>
								<td><span class="ui-icon ui-icon-help" title="Please read the note at the bottom of the page"></span></td>
							</tr>
						</table>
				</div>
			</div>
			<div id="tabs">
				<ul>
									<li><a id="tabtag-0" href="#tab-0">All items - one level</a></li>
									<li><a id="tabtag-1" href="#tab-1">All items - multiple levels</a></li>
									<li><a id="tabtag-2" href="#tab-2">One item - multiple levels</a></li>
								</ul>
									<div id="tab-0" class="ui-panel no-mp">
											<div id="tabs-0" class="no-mp">
							<ul>
																						<li><a id="tabtag-0-1" href="#tab-0-1">Buildings</a></li>
															<li><a id="tabtag-0-2" href="#tab-0-2">Researches</a></li>
														</ul>
																					<div id="tab-0-1" class="ui-panel no-mp">
								<table id="table-0-1" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
									<tr>
										<th style="display: none;"></th>
																				<th >
																							Building																					</th>
																				<th align="center">
																							Level																					</th>
																				<th align="center">
																							Metal																					</th>
																				<th align="center">
																							Crystal																					</th>
																				<th align="center">
																							Deuterium																					</th>
																				<th align="center">
																							Energy																					</th>
																				<th align="center">
																							Time																					</th>
																				<th align="center">
																							Points																					</th>
																				<th align="center">
																							<abbr title="The cost of one speed-up for the Dark Matter.
Buildings and researches are calculated separately,
feet and defenses - by total time for a tab.">DM</abbr>
																					</th>
																			</tr>
																												<tr class="odd">
											<td style="display: none;">1001</td>
											<td class="min">Residential Sector</td>
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
											<td class="min">Biosphere Farm</td>
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
											<td class="min">Research Centre</td>
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
											<td class="min">Academy of Sciences</td>
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
											<td class="min">Neuro-Calibration Centre</td>
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
											<td class="min">High Energy Smelting</td>
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
											<td class="min">Food Silo</td>
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
											<td class="min">Fusion-Powered Production</td>
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
											<td class="min">Skyscraper</td>
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
											<td class="min">Biotech Lab</td>
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
											<td class="min">Planetary Shield</td>
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
											<td class="min">Meditation Enclave</td>
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
											<td class="min">Crystal Farm</td>
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
											<td class="min">Rune Technologium</td>
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
											<td class="min">Rune Forge</td>
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
											<td class="min">Oriktorium</td>
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
											<td class="min">Magma Forge</td>
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
											<td class="min">Disruption Chamber</td>
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
											<td class="min">Megalith</td>
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
											<td class="min">Crystal Refinery</td>
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
											<td class="min">Deuterium Synthesiser</td>
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
											<td class="min">Mineral Research Centre</td>
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
											<td class="min">Advanced Recycling Plant</td>
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
											<td class="min">Assembly Line</td>
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
											<td class="min">Fusion Cell Factory</td>
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
											<td class="min">Robotics Research Centre</td>
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
											<td class="min">Update Network</td>
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
											<td class="min">Quantum Computer Centre</td>
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
											<td class="min">Automatised Assembly Centre</td>
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
											<td class="min">High-Performance Transformer</td>
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
											<td class="min">Microchip Assembly Line</td>
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
											<td class="min">Production Assembly Hall</td>
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
											<td class="min">High-Performance Synthesiser</td>
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
											<td class="min">Chip Mass Production</td>
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
											<td class="min">Nano Repair Bots</td>
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
											<td class="min">Sanctuary</td>
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
											<td class="min">Antimatter Condenser</td>
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
											<td class="min">Vortex Chamber</td>
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
											<td class="min">Halls of Realisation</td>
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
											<td class="min">Forum of Transcendence</td>
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
											<td class="min">Antimatter Convector</td>
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
											<td class="min">Cloning Laboratory</td>
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
											<td class="min">Chrysalis Accelerator</td>
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
											<td class="min">Bio Modifier</td>
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
											<td class="min">Psionic Modulator</td>
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
											<td class="min">Ship Manufacturing Hall</td>
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
											<td class="min">Supra Refractor</td>
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
										<td colspan="1" class="border-n" >Total</td>
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
										<td colspan="2" class="border-n border-w" >Grand total</td>
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
										<td colspan="2" class="border-w">Resources available</td>
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
										<td colspan="2" class="border-w">Resources to deliver</td>
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
										<td class="border-s border-w" >Transports needed</td>
										<td align="center" class="border-s" >0 SC</td>
										<td align="center" class="border-s" >0 LC</td>
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
																							Research																					</th>
																				<th align="center">
																							Level																					</th>
																				<th align="center">
																							Metal																					</th>
																				<th align="center">
																							Crystal																					</th>
																				<th align="center">
																							Deuterium																					</th>
																				<th align="center">
																							Energy																					</th>
																				<th align="center">
																							Time																					</th>
																				<th align="center">
																							Points																					</th>
																				<th align="center">
																							<abbr title="The cost of one speed-up for the Dark Matter.
Buildings and researches are calculated separately,
feet and defenses - by total time for a tab.">DM</abbr>
																					</th>
																			</tr>
																												<tr class="odd">
											<td style="display: none;">1101</td>
											<td class="min">Intergalactic Envoys</td>
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
											<td class="min">High-Performance Extractors</td>
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
											<td class="min">Fusion Drives</td>
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
											<td class="min">Stealth Field Generator</td>
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
											<td class="min">Orbital Den</td>
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
											<td class="min">Research AI</td>
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
											<td class="min">High-Performance Terraformer</td>
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
											<td class="min">Enhanced Production Technologies</td>
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
											<td class="min">Light Fighter Mk II</td>
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
											<td class="min">Cruiser Mk II</td>
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
											<td class="min">Improved Lab Technology</td>
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
											<td class="min">Plasma Terraformer</td>
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
											<td class="min">Low-Temperature Drives</td>
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
											<td class="min">Bomber Mk II</td>
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
											<td class="min">Destroyer Mk II</td>
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
											<td class="min">Battlecruiser Mk II</td>
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
											<td class="min">Robot Assistants</td>
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
											<td class="min">Volcanic Batteries</td>
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
											<td class="min">Acoustic Scanning</td>
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
											<td class="min">High Energy Pump Systems</td>
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
											<td class="min">Cargo Hold Expansion</td>
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
											<td class="min">Magma-Powered Production</td>
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
											<td class="min">Geothermal Power Plants</td>
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
											<td class="min">Depth Sounding</td>
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
											<td class="min">Ion Crystal Enhancement</td>
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
											<td class="min">Improved Stellarator</td>
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
											<td class="min">Hardened Diamond Drill Heads</td>
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
											<td class="min">Seismic Mining Technology</td>
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
											<td class="min">Magma-Powered Pump Systems</td>
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
											<td class="min">Ion Crystal Modules</td>
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
											<td class="min">Optimised Silo Construction Method</td>
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
											<td class="min">Diamond Energy Transmitter</td>
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
											<td class="min">Obsidian Shield Reinforcement</td>
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
											<td class="min">Rune Shields</td>
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
											<td class="min">Rock’tal Collector Enhancement</td>
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
											<td class="min">Catalyser Technology</td>
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
											<td class="min">Plasma Drive</td>
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
											<td class="min">Efficiency Module</td>
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
											<td class="min">Depot AI</td>
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
											<td class="min">General Overhaul (Light Fighter)</td>
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
											<td class="min">Automated Transport Lines</td>
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
											<td class="min">Improved Drone AI</td>
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
											<td class="min">Experimental Recycling Technology</td>
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
											<td class="min">General Overhaul (Cruiser)</td>
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
											<td class="min">Slingshot Autopilot</td>
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
											<td class="min">High-Temperature Superconductors</td>
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
											<td class="min">General Overhaul (Battleship)</td>
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
											<td class="min">Artificial Swarm Intelligence</td>
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
											<td class="min">General Overhaul (Battlecruiser)</td>
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
											<td class="min">General Overhaul (Bomber)</td>
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
											<td class="min">General Overhaul (Destroyer)</td>
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
											<td class="min">Experimental Weapons Technology</td>
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
											<td class="min">Mechan General Enhancement</td>
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
											<td class="min">Heat Recovery</td>
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
											<td class="min">Sulphide Process</td>
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
											<td class="min">Psionic Network</td>
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
											<td class="min">Telekinetic Tractor Beam</td>
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
											<td class="min">Enhanced Sensor Technology</td>
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
											<td class="min">Neuromodal Compressor</td>
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
											<td class="min">Neuro-Interface</td>
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
											<td class="min">Interplanetary Analysis Network</td>
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
											<td class="min">Overclocking (Heavy Fighter)</td>
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
											<td class="min">Telekinetic Drive</td>
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
											<td class="min">Sixth Sense</td>
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
											<td class="min">Psychoharmoniser</td>
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
											<td class="min">Efficient Swarm Intelligence</td>
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
											<td class="min">Overclocking (Large Cargo)</td>
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
											<td class="min">Gravitation Sensors</td>
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
											<td class="min">Overclocking (Battleship)</td>
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
											<td class="min">Psionic Shield Matrix</td>
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
											<td class="min">Kaelesh Discoverer Enhancement</td>
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
										<td colspan="1" class="border-n" >Total</td>
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
										<td colspan="2" class="border-n border-w" >Grand total</td>
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
										<td colspan="2" class="border-w">Resources available</td>
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
										<td colspan="2" class="border-w">Resources to deliver</td>
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
										<td class="border-s border-w" >Transports needed</td>
										<td align="center" class="border-s" >0 SC</td>
										<td align="center" class="border-s" >0 LC</td>
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
																						<li><a id="tabtag-1-1" href="#tab-1-1">Buildings</a></li>
															<li><a id="tabtag-1-2" href="#tab-1-2">Researches</a></li>
														</ul>
																					<div id="tab-1-1" class="ui-panel no-mp">
								<table id="table-1-1" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
									<tr>
										<th style="display: none;"></th>
																				<th >
																							Building																					</th>
																				<th align="center">
																							From level																					</th>
																				<th align="center">
																							To level																					</th>
																				<th align="center">
																							Metal																					</th>
																				<th align="center">
																							Crystal																					</th>
																				<th align="center">
																							Deuterium																					</th>
																				<th align="center">
																							Energy																					</th>
																				<th align="center">
																							Time																					</th>
																				<th align="center">
																							Points																					</th>
																			</tr>
																												<tr class="odd">
											<td style="display: none;">1001</td>
											<td class="min">Residential Sector</td>
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
											<td class="min">Biosphere Farm</td>
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
											<td class="min">Research Centre</td>
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
											<td class="min">Academy of Sciences</td>
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
											<td class="min">Neuro-Calibration Centre</td>
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
											<td class="min">High Energy Smelting</td>
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
											<td class="min">Food Silo</td>
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
											<td class="min">Fusion-Powered Production</td>
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
											<td class="min">Skyscraper</td>
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
											<td class="min">Biotech Lab</td>
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
											<td class="min">Planetary Shield</td>
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
											<td class="min">Meditation Enclave</td>
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
											<td class="min">Crystal Farm</td>
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
											<td class="min">Rune Technologium</td>
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
											<td class="min">Rune Forge</td>
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
											<td class="min">Oriktorium</td>
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
											<td class="min">Magma Forge</td>
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
											<td class="min">Disruption Chamber</td>
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
											<td class="min">Megalith</td>
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
											<td class="min">Crystal Refinery</td>
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
											<td class="min">Deuterium Synthesiser</td>
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
											<td class="min">Mineral Research Centre</td>
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
											<td class="min">Advanced Recycling Plant</td>
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
											<td class="min">Assembly Line</td>
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
											<td class="min">Fusion Cell Factory</td>
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
											<td class="min">Robotics Research Centre</td>
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
											<td class="min">Update Network</td>
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
											<td class="min">Quantum Computer Centre</td>
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
											<td class="min">Automatised Assembly Centre</td>
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
											<td class="min">High-Performance Transformer</td>
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
											<td class="min">Microchip Assembly Line</td>
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
											<td class="min">Production Assembly Hall</td>
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
											<td class="min">High-Performance Synthesiser</td>
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
											<td class="min">Chip Mass Production</td>
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
											<td class="min">Nano Repair Bots</td>
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
											<td class="min">Sanctuary</td>
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
											<td class="min">Antimatter Condenser</td>
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
											<td class="min">Vortex Chamber</td>
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
											<td class="min">Halls of Realisation</td>
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
											<td class="min">Forum of Transcendence</td>
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
											<td class="min">Antimatter Convector</td>
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
											<td class="min">Cloning Laboratory</td>
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
											<td class="min">Chrysalis Accelerator</td>
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
											<td class="min">Bio Modifier</td>
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
											<td class="min">Psionic Modulator</td>
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
											<td class="min">Ship Manufacturing Hall</td>
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
											<td class="min">Supra Refractor</td>
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
										<td colspan="2" class="border-n" >Total</td>
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
										<td colspan="3" class="border-n border-w" >Grand total</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
																				<td align="center" class="border-n border-e" >0</td>
									</tr>
									<tr>
										<td style="display: none;">ra</td>
										<td colspan="3" class="border-w">Resources available</td>
										<td align="center"><input id="metal-available-1-1" type="text" name="metal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="crystal-available-1-1" type="text" name="crystal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="deut-available-1-1" type="text" name="deut-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td></td>
										<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">dlv</td>
										<td colspan="3" class="border-w">Resources to deliver</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td></td>
										<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">gtt</td>
										<td class="border-s border-w" >Transports needed</td>
										<td align="center" class="border-s" >0 SC</td>
										<td align="center" class="border-s" >0 LC</td>
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
																							Research																					</th>
																				<th align="center">
																							From level																					</th>
																				<th align="center">
																							To level																					</th>
																				<th align="center">
																							Metal																					</th>
																				<th align="center">
																							Crystal																					</th>
																				<th align="center">
																							Deuterium																					</th>
																				<th align="center">
																							Energy																					</th>
																				<th align="center">
																							Time																					</th>
																				<th align="center">
																							Points																					</th>
																			</tr>
																												<tr class="odd">
											<td style="display: none;">1101</td>
											<td class="min">Intergalactic Envoys</td>
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
											<td class="min">High-Performance Extractors</td>
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
											<td class="min">Fusion Drives</td>
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
											<td class="min">Stealth Field Generator</td>
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
											<td class="min">Orbital Den</td>
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
											<td class="min">Research AI</td>
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
											<td class="min">High-Performance Terraformer</td>
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
											<td class="min">Enhanced Production Technologies</td>
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
											<td class="min">Light Fighter Mk II</td>
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
											<td class="min">Cruiser Mk II</td>
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
											<td class="min">Improved Lab Technology</td>
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
											<td class="min">Plasma Terraformer</td>
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
											<td class="min">Low-Temperature Drives</td>
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
											<td class="min">Bomber Mk II</td>
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
											<td class="min">Destroyer Mk II</td>
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
											<td class="min">Battlecruiser Mk II</td>
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
											<td class="min">Robot Assistants</td>
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
											<td class="min">Volcanic Batteries</td>
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
											<td class="min">Acoustic Scanning</td>
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
											<td class="min">High Energy Pump Systems</td>
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
											<td class="min">Cargo Hold Expansion</td>
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
											<td class="min">Magma-Powered Production</td>
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
											<td class="min">Geothermal Power Plants</td>
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
											<td class="min">Depth Sounding</td>
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
											<td class="min">Ion Crystal Enhancement</td>
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
											<td class="min">Improved Stellarator</td>
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
											<td class="min">Hardened Diamond Drill Heads</td>
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
											<td class="min">Seismic Mining Technology</td>
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
											<td class="min">Magma-Powered Pump Systems</td>
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
											<td class="min">Ion Crystal Modules</td>
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
											<td class="min">Optimised Silo Construction Method</td>
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
											<td class="min">Diamond Energy Transmitter</td>
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
											<td class="min">Obsidian Shield Reinforcement</td>
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
											<td class="min">Rune Shields</td>
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
											<td class="min">Rock’tal Collector Enhancement</td>
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
											<td class="min">Catalyser Technology</td>
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
											<td class="min">Plasma Drive</td>
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
											<td class="min">Efficiency Module</td>
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
											<td class="min">Depot AI</td>
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
											<td class="min">General Overhaul (Light Fighter)</td>
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
											<td class="min">Automated Transport Lines</td>
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
											<td class="min">Improved Drone AI</td>
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
											<td class="min">Experimental Recycling Technology</td>
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
											<td class="min">General Overhaul (Cruiser)</td>
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
											<td class="min">Slingshot Autopilot</td>
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
											<td class="min">High-Temperature Superconductors</td>
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
											<td class="min">General Overhaul (Battleship)</td>
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
											<td class="min">Artificial Swarm Intelligence</td>
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
											<td class="min">General Overhaul (Battlecruiser)</td>
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
											<td class="min">General Overhaul (Bomber)</td>
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
											<td class="min">General Overhaul (Destroyer)</td>
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
											<td class="min">Experimental Weapons Technology</td>
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
											<td class="min">Mechan General Enhancement</td>
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
											<td class="min">Heat Recovery</td>
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
											<td class="min">Sulphide Process</td>
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
											<td class="min">Psionic Network</td>
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
											<td class="min">Telekinetic Tractor Beam</td>
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
											<td class="min">Enhanced Sensor Technology</td>
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
											<td class="min">Neuromodal Compressor</td>
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
											<td class="min">Neuro-Interface</td>
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
											<td class="min">Interplanetary Analysis Network</td>
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
											<td class="min">Overclocking (Heavy Fighter)</td>
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
											<td class="min">Telekinetic Drive</td>
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
											<td class="min">Sixth Sense</td>
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
											<td class="min">Psychoharmoniser</td>
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
											<td class="min">Efficient Swarm Intelligence</td>
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
											<td class="min">Overclocking (Large Cargo)</td>
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
											<td class="min">Gravitation Sensors</td>
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
											<td class="min">Overclocking (Battleship)</td>
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
											<td class="min">Psionic Shield Matrix</td>
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
											<td class="min">Kaelesh Discoverer Enhancement</td>
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
										<td colspan="2" class="border-n" >Total</td>
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
										<td colspan="3" class="border-n border-w" >Grand total</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
										<td align="center" class="border-n" >0</td>
																				<td align="center" class="border-n border-e" >0</td>
									</tr>
									<tr>
										<td style="display: none;">ra</td>
										<td colspan="3" class="border-w">Resources available</td>
										<td align="center"><input id="metal-available-1-2" type="text" name="metal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="crystal-available-1-2" type="text" name="crystal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td align="center"><input id="deut-available-1-2" type="text" name="deut-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
										<td></td>
										<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">dlv</td>
										<td colspan="3" class="border-w">Resources to deliver</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td align="center" >0</td>
										<td></td>
										<td></td>
																				<td class="border-e"></td>
									</tr>
									<tr>
										<td style="display: none;">gtt</td>
										<td class="border-s border-w" >Transports needed</td>
										<td align="center" class="border-s" >0 SC</td>
										<td align="center" class="border-s" >0 LC</td>
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
																												<optgroup label="Buildings">
																															<option value="1001" >Residential Sector</option>
																					<option value="1002" >Biosphere Farm</option>
																					<option value="1003" >Research Centre</option>
																					<option value="1004" >Academy of Sciences</option>
																					<option value="1005" >Neuro-Calibration Centre</option>
																					<option value="1006" >High Energy Smelting</option>
																					<option value="1007" >Food Silo</option>
																					<option value="1008" >Fusion-Powered Production</option>
																					<option value="1009" >Skyscraper</option>
																					<option value="1010" >Biotech Lab</option>
																					<option value="1011" >Metropolis</option>
																					<option value="1012" >Planetary Shield</option>
																					<option value="2001" >Meditation Enclave</option>
																					<option value="2002" >Crystal Farm</option>
																					<option value="2003" >Rune Technologium</option>
																					<option value="2004" >Rune Forge</option>
																					<option value="2005" >Oriktorium</option>
																					<option value="2006" >Magma Forge</option>
																					<option value="2007" >Disruption Chamber</option>
																					<option value="2008" >Megalith</option>
																					<option value="2009" >Crystal Refinery</option>
																					<option value="2010" >Deuterium Synthesiser</option>
																					<option value="2011" >Mineral Research Centre</option>
																					<option value="2012" >Advanced Recycling Plant</option>
																					<option value="3001" >Assembly Line</option>
																					<option value="3002" >Fusion Cell Factory</option>
																					<option value="3003" >Robotics Research Centre</option>
																					<option value="3004" >Update Network</option>
																					<option value="3005" >Quantum Computer Centre</option>
																					<option value="3006" >Automatised Assembly Centre</option>
																					<option value="3007" >High-Performance Transformer</option>
																					<option value="3008" >Microchip Assembly Line</option>
																					<option value="3009" >Production Assembly Hall</option>
																					<option value="3010" >High-Performance Synthesiser</option>
																					<option value="3011" >Chip Mass Production</option>
																					<option value="3012" >Nano Repair Bots</option>
																					<option value="4001" >Sanctuary</option>
																					<option value="4002" >Antimatter Condenser</option>
																					<option value="4003" >Vortex Chamber</option>
																					<option value="4004" >Halls of Realisation</option>
																					<option value="4005" >Forum of Transcendence</option>
																					<option value="4006" >Antimatter Convector</option>
																					<option value="4007" >Cloning Laboratory</option>
																					<option value="4008" >Chrysalis Accelerator</option>
																					<option value="4009" >Bio Modifier</option>
																					<option value="4010" >Psionic Modulator</option>
																					<option value="4011" >Ship Manufacturing Hall</option>
																					<option value="4012" >Supra Refractor</option>
																				</optgroup>
																			<optgroup label="Researches">
																															<option value="1101" >Intergalactic Envoys</option>
																					<option value="1102" >High-Performance Extractors</option>
																					<option value="1103" >Fusion Drives</option>
																					<option value="1104" >Stealth Field Generator</option>
																					<option value="1105" >Orbital Den</option>
																					<option value="1106" >Research AI</option>
																					<option value="1107" >High-Performance Terraformer</option>
																					<option value="1108" >Enhanced Production Technologies</option>
																					<option value="1109" >Light Fighter Mk II</option>
																					<option value="1110" >Cruiser Mk II</option>
																					<option value="1111" >Improved Lab Technology</option>
																					<option value="1112" >Plasma Terraformer</option>
																					<option value="1113" >Low-Temperature Drives</option>
																					<option value="1114" >Bomber Mk II</option>
																					<option value="1115" >Destroyer Mk II</option>
																					<option value="1116" >Battlecruiser Mk II</option>
																					<option value="1117" >Robot Assistants</option>
																					<option value="1118" >Supercomputer</option>
																					<option value="2101" >Volcanic Batteries</option>
																					<option value="2102" >Acoustic Scanning</option>
																					<option value="2103" >High Energy Pump Systems</option>
																					<option value="2104" >Cargo Hold Expansion</option>
																					<option value="2105" >Magma-Powered Production</option>
																					<option value="2106" >Geothermal Power Plants</option>
																					<option value="2107" >Depth Sounding</option>
																					<option value="2108" >Ion Crystal Enhancement</option>
																					<option value="2109" >Improved Stellarator</option>
																					<option value="2110" >Hardened Diamond Drill Heads</option>
																					<option value="2111" >Seismic Mining Technology</option>
																					<option value="2112" >Magma-Powered Pump Systems</option>
																					<option value="2113" >Ion Crystal Modules</option>
																					<option value="2114" >Optimised Silo Construction Method</option>
																					<option value="2115" >Diamond Energy Transmitter</option>
																					<option value="2116" >Obsidian Shield Reinforcement</option>
																					<option value="2117" >Rune Shields</option>
																					<option value="2118" >Rock’tal Collector Enhancement</option>
																					<option value="3101" >Catalyser Technology</option>
																					<option value="3102" >Plasma Drive</option>
																					<option value="3103" >Efficiency Module</option>
																					<option value="3104" >Depot AI</option>
																					<option value="3105" >General Overhaul (Light Fighter)</option>
																					<option value="3106" >Automated Transport Lines</option>
																					<option value="3107" >Improved Drone AI</option>
																					<option value="3108" >Experimental Recycling Technology</option>
																					<option value="3109" >General Overhaul (Cruiser)</option>
																					<option value="3110" >Slingshot Autopilot</option>
																					<option value="3111" >High-Temperature Superconductors</option>
																					<option value="3112" >General Overhaul (Battleship)</option>
																					<option value="3113" >Artificial Swarm Intelligence</option>
																					<option value="3114" >General Overhaul (Battlecruiser)</option>
																					<option value="3115" >General Overhaul (Bomber)</option>
																					<option value="3116" >General Overhaul (Destroyer)</option>
																					<option value="3117" >Experimental Weapons Technology</option>
																					<option value="3118" >Mechan General Enhancement</option>
																					<option value="4101" >Heat Recovery</option>
																					<option value="4102" >Sulphide Process</option>
																					<option value="4103" >Psionic Network</option>
																					<option value="4104" >Telekinetic Tractor Beam</option>
																					<option value="4105" >Enhanced Sensor Technology</option>
																					<option value="4106" >Neuromodal Compressor</option>
																					<option value="4107" >Neuro-Interface</option>
																					<option value="4108" >Interplanetary Analysis Network</option>
																					<option value="4109" >Overclocking (Heavy Fighter)</option>
																					<option value="4110" >Telekinetic Drive</option>
																					<option value="4111" >Sixth Sense</option>
																					<option value="4112" >Psychoharmoniser</option>
																					<option value="4113" >Efficient Swarm Intelligence</option>
																					<option value="4114" >Overclocking (Large Cargo)</option>
																					<option value="4115" >Gravitation Sensors</option>
																					<option value="4116" >Overclocking (Battleship)</option>
																					<option value="4117" >Psionic Shield Matrix</option>
																					<option value="4118" >Kaelesh Discoverer Enhancement</option>
																				</optgroup>
																			</select>
									</td>
									<td><label for="tab2-from-level">&nbsp;From level</label></td>
									<td><input id="tab2-from-level" type="text" name="tab2-from-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
									<td><label for="tab2-to-level">To level</label></td>
									<td><input id="tab2-to-level" type="text" name="tab2-to-level" class="ui-state-default ui-corner-all ui-input level-input ui-input-margin" value="0"/></td>
								</tr>
							</table>
						</div>
						<div id="commons-table-div">
							<table id="commons-table" class="lined" cellpadding="0" cellspacing="1" border="0" width="100%">
								<tr>
																	<th>Level</th>
																	<th>Metal</th>
																	<th>Crystal</th>
																	<th>Deuterium</th>
																	<th>Energy</th>
																	<th>Time</th>
																	<th>Points</th>
																</tr>
								<tr>
									<td colspan="7">&nbsp;</td>
								</tr>
								<tr class="odd">
									<td class="border-n border-w" >Total</td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n" ><b>0</b></td>
									<td align="center" class="border-n border-e" ><b>0</b></td>
								</tr>
								<tr>
									<td class="border-w">Resources available</td>
									<td align="center"><input id="metal-available-2-1" type="text" name="metal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
									<td align="center"><input id="crystal-available-2-1" type="text" name="crystal-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
									<td align="center"><input id="deut-available-2-1" type="text" name="deut-available" class="ui-state-default ui-corner-all ui-input res-input " value="0" /></td>
									<td></td>
									<td></td>
									<td class="border-e"></td>
								</tr>
								<tr>
									<td class="border-w">Resources to deliver</td>
									<td align="center" >0</td>
									<td align="center" >0</td>
									<td align="center" >0</td>
									<td></td>
									<td></td>
									<td class="border-e"></td>
								</tr>
								<tr class="odd">
									<td class="border-s border-w" >Transports needed</td>
									<td align="center" class="border-s" >0 SC</td>
									<td align="center" class="border-s">0 LC</td>
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
					<span id= "hint-message">The final bonus varies from planet to planet. To get accurate results, manually calculate the total bonus on the planet where you will start the construction/research.</span>
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
