// LANGUAGE

String.prototype.parse = function(...args) {
    let val = this
    for (i = 0; i < args.length; i++) {
        val = val.replace(`{${i}}`, args[i])
    }
    return val
}

const LANGUAGE={
	// EN.ENGLISH
	'about': 'en',
	'account': 'en',
	'assets': 'en',
	'balance': 'en',
	'book': 'en',
	'buy': 'en',
	'close': 'en',
	'hello': 'en',
	'help': 'en',
	'history': 'en',
	'name': 'en',
	'orders': 'en',
	'pay': 'en',
	'price': 'en',
	'register': 'en',
	'say': 'en',
	'sell': 'en',
	'test': 'en',
	'trades': 'en',
	'trust': 'en',
	// ES.SPANISH
	//'acepta': 'es',
	//'acerca': 'es',
	//'ayuda': 'es',
	//'cancela': 'es',
	//'compra': 'es',
	//'cuenta': 'es',
	//'dile': 'es',
	//'estado': 'es',
	//'hola': 'es',
	//'libro': 'es',
	//'nombre': 'es',
	//'ordenes': 'es',
	//'paga': 'es',
	//'precio': 'es',
	//'prueba': 'es',
	//'registrar': 'es',
	//'saldo': 'es',
	//'vende': 'es',
	//'ventas': 'es',
	// CN.CHINESE
	// DE.GERMAN
	// FR.FRENCH
	// IT.ITALIAN
	// JP.JAPANESE
	// PT.PORTUGUESE
	'aceita': 'br',
	'ajuda': 'br',
	'anula': 'br',
	'compra': 'br',
	'conta': 'br',
	'diga': 'br',
	'historia': 'br',
	'história': 'br',
	'livro': 'br',
	'nome': 'br',
	'ola': 'br',
	'ordens': 'br',
	'paga': 'br',
	'preco': 'br',
	'preço': 'br',
	'prova': 'br',
	'registre': 'br',
	'saldo': 'br',
	'sobre': 'br',
	'vende': 'br',
	'vendas': 'br'
}

const helpEN = '*Fonpago actions*\n\n'+
				'Here is a list of the things you can do:\n\n'+
				'*register*: create account and register user name\n'+
				'```'+
				'  register George\n'+
				'  register JohnDoe\n'+
				'  register Patty123\n'+
				'  register Walmart\n'+
				'```'+
				'_Note: only letters and numbers, no special characters or spaces_ \n\n'+
				'*account*: show your public key and qr-code\n\n'+
				'*name*: change the name of your account\n\n'+
				'*balance*: show the balance in your account\n\n'+
				'*history*: show last 10 transactions \n\n'+
				'*pay*: send money to Fonpago users\n'+
				'```'+
				'  pay 100 to George\n'+
				'  pay 150 BTC to Caroline\n'+
				'  pay 200 USD to Walmart ref 123456\n'+
				'```'+
				'_Note: refs are useful for tracking payments to specific orders_ \n\n'+
				'*price* to check TON price\n\n'+
				'*price ANY* to check any crypto/forex price by symbol\n\n'+
				//'@name to send messages to any user\n\n'+
				//'*help trade*: trading information\n\n'+
				'*help*: this information'

const tradeEN = '*Trading actions*\n\n'+
				'*price*: show currency prices\n'+
				'```'+
				'  price\n'+
				'  price BTC\n'+
				'  price TON\n'+
				'```\n'+
				'*sell*: exchange assets in the market\n'+
				'```'+
				'  sell 100 USD (at market price)\n'+
				'  sell 100 USD at 22\n'+
				'  sell 200 JPY at 2500\n'+
				'  sell 300 BTC/USD at 7500\n'+
				'```\n'+
				'*buy*: exchange assets in the market\n'+
				'```'+
				'  buy 100 USD (at market price)\n'+
				'  buy 100 USD at 20\n'+
				'  buy 100 JPY at 2200\n'+
				'  buy 100 BTC/USD at 7250\n'+
				'```\n'+
				'*close*: cancel open offer by id\n'+
				'```'+
				'  close all\n'+
				'  close 123456\n'+
				'```\n'+
				'*book*: list orderbook for market pair\n'+
				'```'+
				'  book TON\n'+
				'  book BTC/USD\n'+
				'```\n'+
				'*orders*: list your open offers in the market\n\n'+
				'*trades*: list your offers in trading history'

const helpES = '*Acciones en Fonpago*\n\n'+
				'Aquí tienes una lista de las cosas que puedes hacer:\n\n'+
				'*registrar*: crear cuenta y registrar nombre de usuario\n'+
				'```'+
				'  registrar Jorge\n'+
				'  registrar LuisPerez\n'+
				'  registrar Maria123\n'+
				'  registrar Walmart\n'+
				'```'+
				'_Nota: sólo letras y números, sin espacios ni caracteres especiales_ \n\n'+
				'*cuenta*: ver tu número de cuenta y código QR\n\n'+
				'*nombre*: cambiar el nombre de usuario\n\n'+
				'*saldo*: ver el saldo en tu cuenta\n\n'+
				'*estado*: ver últimos 10 movimientos\n\n'+
				'*paga*: enviar dinero a usuarios Fonpago\n'+
				'```'+
				'  paga 100 a Jorge\n'+
				'  paga 150 BTC a Carolina\n'+
				'  paga 200 USD a Walmart ref 123456\n'+
				'```'+
				'_Nota: referencias son útiles para control de facturas_ \n\n'+
				'*precio* para ver precio de TON\n\n'+
				'*precio ANY* para ver precios de cripto/forex\n\n'+
				//'@nombre para enviar mensajes a un usuario\n\n'+
				//'*ayuda ventas*: información en intercambio de activos\n\n'+
				'*ayuda*: esta información'

const tradeES = '*Intercambio de activos*\n\n'+
				'*precio*: ver precio de monedas\n'+
				'```'+
				'  precio\n'+
				'  precio BTC\n'+
				'  precio TON\n'+
				'```\n'+
				'*vende*: vender activos en el mercado\n'+
				'```'+
				'  vende 100 USD a 22\n'+
				'  vende 200 JPY a 2500\n'+
				'  vende 300 BTC/USD a 7500\n'+
				'```\n'+
				'*compra*: comprar activos en el mercado\n'+
				'```'+
				'  compra 100 USD a 20\n'+
				'  compra 100 JPY a 2200\n'+
				'  compra 100 BTC/USD a 7250\n'+
				'```\n'+
				'*cancela*: cancelar orden abierta según número\n'+
				'```'+
				'  cancela todo\n'+
				'  cancela 123456\n'+
				'```\n'+
				'*libro*: lista de ofertas en el mercado\n'+
				'```'+
				'  libro TON\n'+
				'  libro BTC/USD\n'+
				'```\n'+
				'*ordenes*: lista tus órdenes abiertas en el mercado\n\n'+
				'*ventas*: lista tus órdenes ya ejecutadas\n\n'

const helpBR =  '*Ações no Fonpago*\n\n'+
				'Aqui está uma lista de coisas que você pode fazer:\n\n'+
				'*registre*: criar uma conta e registrar um nome de usuário\n'+
				'```'+
				'  registre Luiz\n'+
				'  registre Maria123\n'+
				'  registre Walmart\n'+
				'```'+
				'_Observação: somente letras e números, sem espaços ou caracteres especiais_\n\n'+
				'*conta*: Visualize seu número de conta e código QR\n\n'+
				'*nome*: alterar o nome de usuário\n\n'+
				'*saldo*: veja o saldo da sua conta\n\n'+
				'*historia*: ver os últimos 10 movimentos\n\n'+
				'*paga*: enviar dinheiro para usuários do Fonpago\n'+
				'```'+
				'  paga 100 para Luiz\n'+
				'  paga 150 BTC para Cristina\n'+
				'  paga 200 USD para Walmart ref 123456\n'+
				'```'+
				'_Observação: As referências são úteis para o controle de faturas_\n\n'+
				'*preço* para ver o preço do TON\n\n'+
				'*preço ANY* para ver preços de criptomoedas e forex\n\n'+
				//'@nome para enviar mensagens a um usuário\n\n'+
				'*ajuda*: esta informação'

const tradeBR = '*Troca de Ativos*\n\n'+
				'*preço*: veja o preço da moeda\n'+
				'```'+
				'  preço\n'+
				'  preço BTC\n'+
				'  preço TON\n'+
				'```\n'+
				'*vender*: vender ativos no mercado\n'+
				'```'+
				'  venda 100 USD a 22\n'+
				'  venda 200 JPY a 2500\n'+
				'  venda 300 BTC/USD a 7500\n'+
				'```\n'+
				'*comprar*: comprar ativos no mercado\n'+
				'```'+
				'  compra 100 USD a 20\n'+
				'  compra 100 JPY a 2200\n'+
				'  compra 100 BTC/USD a 7250\n'+
				'```\n'+
				'*cancelar*: cancelar pedido aberto por número\n'+
				'```'+
				'  cancela tudo\n'+
				'  cancela 123456\n'+
				'```\n'+
				'*livro*: lista de ofertas no mercado\n'+
				'```'+
				'  livro TON\n'+
				'  livro BTC/USD\n'+
				'```\n'+
				'*ordens*: liste suas ordens abertas no mercado\n\n'+
				'*vendas*: liste seus pedidos já executados\n\n'

const VOCABULARY={
	'en':{
		'about'   : 'about',
		'help'    : 'help',
		'hello'   : 'hello',
		'register': 'register',
		'name'    : 'name',
		'account' : 'account',
		'balance' : 'balance',
		'history' : 'history',
		'pay'     : 'pay',
		'to'      : 'to',
		'price'   : 'price',
		'trust'   : 'trust',
		'assets'  : 'assets',
		'sell'    : 'sell',
		'at'      : 'at',
		'buy'     : 'buy',
		'close'   : 'close',
		'book'    : 'book',
		'orders'  : 'orders',
		'trades'  : 'trades',
		'say'     : 'say',
		'set'     : 'set',
		'test'    : 'test',

		// Actions
		'maintenance':'Fonpago is down for maintenance, try again in a moment',
		'welcome':'Welcome',
		'welcomeApp':'Welcome to Fonpago',
		'welcomeHelp': 'Your account has been created, type `help` for more info',
		'notFound':'Not found',
		'sendPhoneButton': 'Send phone number',
		'sendPhoneText': 'Send your phone number to register your account',
		'phoneRegistered':'Your phone number has been registered',
		'aboutText': '*Fonpago {0}*\nPayments in Telegram\nAll rights reserved',
		'helpText': helpEN,
		'noNameProvided': 'No name provided, to register an account you need a name as in `register JohnDoe`',
		'alreadyRegisteredWelcome': 'You already registered an account, welcome back {0}',
		'alreadyRegisteredName': 'You already registered an account, your name is {0}. If you want to change your name type `name NewName` instead',
		'invalidName': 'Invalid name, only letters and numbers allowed, no spaces or symbols',
		'invalidNameFirstChar': 'First character must be a letter from A to Z, not a number or symbol',
		'invalidNameLength': 'Invalid name, no more than 30 characters',
		'invalidAction': 'Invalid action `{0}`, type `help` for more info',
		'nameTaken': '{0} is already taken, try again',
		'messageDelivered': 'Message delivered',
		'accountNotFound': 'Account not found, register first or try again later',
		'noNameYet': 'You don\'t have a name yet',
		'yourNameIs': 'Your name is {0}',
		'nameSet': 'Your name has been set to {0}',
		'yourBalanceIs': 'Your balance is',
		'lastTransactions': 'Last 10 transactions',
		'newAccount': 'Creating new account, it may take a minute...',
		'payWord': 'pay',
		'payFrom': 'from',
		'payTo': 'to',
		'payNew': 'New',
		'payRec': 'Rec',
		'payPay': 'Pay',
		'priceUnavailable':'Price not available',
		'testOk': 'Test ok',
		'insufficientFunds': 'Insufficient funds, payment not sent',
		'invalidAmount': 'Invalid amount {0}',
		'notRegistered': 'You are not registered, type `register` to open your account',
		'destinationNotFound': 'Destination not found',
		'paymentFailed': 'Payment failed',
		'paymentSent': 'Payment sent',
		'paymentSentNotConfirmed': 'Payment sent, waiting for confirmation...',
		'paymentConfirmed': 'Payment confirmed',
		'paymentReceived': 'Payment of {0} {1} received from {2}',
		'newTrustline': 'Now you can receive payments in {0}',
		'allWord': 'all',
		'buyWord': 'Buy',
		'sellWord': 'Sell',
		'noOpenOrders': 'No open orders',
		'ordersWord': 'Orders',

		// Errors
		'error': 'Error',
		'errorNotFound': 'Error not found',
		'errorNoFunds': 'Insufficient funds',
		'errorAccessingDatabase': 'Error accessing database, try again in a moment',
		'errorFunding': 'Error funding account, try again in a moment',
		'errorOpening': 'Error opening account, try again in a moment',
		'errorRegistering': 'Error registering account, try again later',
		'errorSearching': 'Error searching for account, try again later',
		'errorAccessing': 'Error accessing account, try again in a moment',
		'errorRegisteringName': 'Error registering name, try again in a moment',
		'errorContactingServer': 'Error contacting server, try again later',
		'errorServerUnavailable': 'Error: server unavailable, try again later',
		'errorLoadingHistory': 'Error loading history, try again in a moment',
		'errorAccessingHistory': 'Error accessing history, try again in a moment',
		'errorNoTrustline': 'Error: Receiver has no trustline for asset {0}',
		'errorSenderNoTrustline': 'Error: Sender has no trustline for asset {0}',
		'errorInPayment': 'Error in payment',
		'errorInPaymentTry': 'Error in payment, try again later',
		'errorSendingPayment': 'Error sending payment, try again later',
		'errorNoTrustSender': 'Error: Asset not trusted by sender',
		'errorNoTrustReceiver': 'Error: Asset not trusted by receiver',
		'errorExceedingLimit': 'Error: Exceding asset limit of receiver',
		'errorNotEnoughFunds': 'Not enough funds, payment not sent',
		'errorInTrustline': 'Error adding trustline to {0}',
		'errorReadingOrders': 'Error reading orders',
	},
	'es':{
		'about'   : 'acerca',
		'help'    : 'ayuda',
		'hello'   : 'hola',
		'register': 'registrar',
		'name'    : 'nombre',
		'account' : 'cuenta',
		'balance' : 'saldo',
		'history' : 'estado',
		'pay'     : 'paga',
		'to'      : 'a',
		'price'   : 'precio',
		'trust'   : 'acepta',
		'assets'  : 'activos',
		'sell'    : 'vende',
		'at'      : 'a',
		'buy'     : 'compra',
		'close'   : 'cancela',
		'book'    : 'libro',
		'orders'  : 'ordenes',
		'trades'  : 'ventas',
		'say'     : 'dile',
		'set'     : 'opcion',
		'test'    : 'prueba',

		// Actions
		'maintenance':'Fonpago está en mantenimiento, intenta de nuevo en unos momentos',
		'welcome':'Bienvenido',
		'welcomeApp':'Bienvenido a Fonpago',
		'welcomeHelp': 'Tu cuenta ha sido creada, tipea `ayuda` para más información',
		'notFound':'No encontrado',
		'sendPhoneButton': 'Enviar número de teléfono',
		'sendPhoneText': 'Envía tu número telefónico para registrar tu cuenta',
		'phoneRegistered': 'Tu número telefónico ha sido registrado',
		'aboutText': '*Fonpago {0}*\nPagos en Telegram\nDerechos reservados',
		'helpText': helpES,
		'noNameProvided': 'El nombre es necesario para registrar una cuenta como en `registrar LuisPerez`',
		'alreadyRegisteredWelcome': 'Ya tienes una cuenta registrada, bienvenido {0}',
		'alreadyRegisteredName': 'Ya tienes una cuenta registrada y tu nombre es {0}. Si quieres cambiar tu nombre usa `nombre LuisPerez`',
		'invalidName': 'Nombre inválido, solo letras y números son permitidos, sin espacios ni símbolos',
		'invalidNameFirstChar': 'Primer caracter debe ser una letra de A a Z, no número o símbolo',
		'invalidNameLength': 'Nombre inválido, no mas de 30 caracteres',
		'nameTaken': 'Nombre ya tomado, intenta con otro',
		'invalidAction': 'Acción inválida `{0}`, tipea `ayuda` para mas información',
		'messageDelivered': 'Mensaje entregado',
		'accountNotFound': 'Cuenta no encontrada, regístrate primero o intenta de nuevo',
		'noNameYet': 'No tienes nombre aún',
		'yourNameIs': 'Tu nombre es {0}',
		'nameSet': 'Tu nombre ha sido registrado como {0}',
		'yourBalanceIs': 'Tu saldo es',
		'lastTransactions': 'Ultimas 10 transacciones',
		'newAccount': 'Creando nueva cuenta, puede tardar un minuto...',
		'payWord': 'paga',
		'payFrom': 'de',
		'payTo': 'a',
		'payNew': 'Nueva',
		'payRec': 'Rec',
		'payPay': 'Pag',
		'priceUnavailable':'Precio no disponible',
		'testOk': 'Prueba ok',
		'insufficientFunds': 'Fondos insuficientes, pago no enviado',
		'invalidAmount': 'Monto inválido {0}',
		'notRegistered': 'No estás registrado, tipea `registrar TuNombre` para abrir una cuenta',
		'destinationNotFound': 'Destinatario no encontrado',
		'paymentFailed': 'Error en el pago',
		'paymentSent': 'Pago enviado',
		'paymentSentNotConfirmed': 'Pago enviado, esperando confirmación...',
		'paymentConfirmed': 'Pago confirmado',
		'paymentReceived': 'Pago de {0} {1} recibido de {2}',
		'newTrustline': 'Ya puedes aceptar pagos en {0}',
		'allWord': 'todo',
		'buyWord': 'Compra',
		'sellWord': 'Vende',
		'noOpenOrders': 'No hay órdenes abiertas',
		'ordersWord': 'Ordenes',

		// Errors
		'error': 'Error',
		'errorNotFound': 'Información no disponible',
		'errorNoFunds': 'Fondos insuficientes',
		'errorAccessingDatabase': 'Error accesando base de datos, intente en un momento',
		'errorFunding': 'Error creando cuenta, intenta en un momento',
		'errorOpening': 'Error abriendo cuenta, intenta en un momento',
		'errorRegistering': 'Error registrando cuenta, intenta en un momento',
		'errorSearching': 'Error buscando cuenta, intenta en un momento',
		'errorAccessing': 'Error accesando cuenta, intenta en un momento',
		'errorRegisteringName': 'Error registrando nombre, intenta en un momento',
		'errorContactingServer': 'Error contactando servidor, intenta en un momento',
		'errorServerUnavailable': 'Error: servidor no disponible, intenta en un momento',
		'errorLoadingHistory': 'Error leyendo estado de cuenta',
		'errorAccessingHistory': 'Error accesando estado de cuenta',
		'errorNoTrustline': 'Error: Recipiente no puede aceptar {0}',
		'errorSenderNoTrustline': 'Error: Usuario no puede enviar {0}',
		'errorInPayment': 'Error en pago',
		'errorInPaymentTry': 'Error en pago, intenta en un momento',
		'errorSendingPayment': 'Error enviando pago, intenta en un momento',
		'errorNoTrustSender': 'Error: Activo no aceptado por origen',
		'errorNoTrustReceiver': 'Error: Activo no aceptado por destino',
		'errorExceedingLimit': 'Error: Límite de activo excedido',
		'errorNotEnoughFunds': 'Fondos insuficientes, pago no enviado',
		'errorInTrustline': 'Error aceptando activo {0}', 
		'errorReadingOrders': 'Error leyendo órdenes',
	},
	'br':{
		'about'   : 'sobre',
		'help'    : 'ajuda',
		'hello'   : 'ola',
		'register': 'registre',
		'name'    : 'nome',
		'account' : 'conta',
		'balance' : 'saldo',
		'history' : 'historia',
		'pay'     : 'paga',
		'to'      : 'a',
		'price'   : 'preço',
		'trust'   : 'aceita',
		'assets'  : 'activos',
		'sell'    : 'vende',
		'at'      : 'a',
		'buy'     : 'compra',
		'close'   : 'anula',
		'book'    : 'livro',
		'orders'  : 'ordens',
		'trades'  : 'vendas',
		'say'     : 'diga',
		'set'     : 'opcao',
		'test'    : 'prova',

		// Actions
		'maintenance':'Fonpago está em manutenção, tente novamente em alguns instantes.',
		'welcome':'Bem-vindo',
		'welcomeApp':'Bem-vindo ao Fonpago',
		'welcomeHelp': 'Sua conta foi criada, digite `ajuda` para mais informações',
		'notFound':'Não encontrado',
		'sendPhoneButton': 'Enviar número de telefone',
		'sendPhoneText': 'Envie seu número de telefone para registrar sua conta',
		'phoneRegistered': 'Seu número de telefone foi registrado',
		'aboutText': '*Fonpago {0}*\nPagamentos em Telegram\nTodos os direitos reservados',
		'helpText': helpBR,
		'noNameProvided': 'O nome é necessário para registrar uma conta como em `registre LuisPerez`',
		'alreadyRegisteredWelcome': 'Você já possui uma conta registrada, bem-vindo {0}',
		'alreadyRegisteredName': 'Você já tem uma conta registrada e seu nome é {0}. Se você quiser mudar seu nome use `nome LuisPerez`',
		'invalidName': 'Nome inválido, apenas letras e números são permitidos, sem espaços ou símbolos',
		'invalidNameFirstChar': 'O primeiro caractere deve ser uma letra de A a Z, não um número ou símbolo',
		'invalidNameLength': 'Nome inválido, máximo 30 caracteres',
		'nameTaken': 'Nome já escolhido, tente outro',
		'invalidAction': 'Ação inválida `{0}`, digite `ajuda` para mais informações',
		'messageDelivered': 'Mensagem entregue',
		'accountNotFound': 'Conta não encontrada, registre-se primeiro ou tente novamente',
		'noNameYet': 'Você ainda não tem um nome',
		'yourNameIs': 'Seu nome é {0}',
		'nameSet': 'Seu nome foi registrado como {0}',
		'yourBalanceIs': 'Seu saldo é',
		'lastTransactions': 'Últimas 10 transações',
		'newAccount': 'Criando uma nova conta, pode demorar um minuto...',
		'payWord': 'paga',
		'payFrom': 'de',
		'payTo': 'para',
		'payNew': 'Novo',
		'payRec': 'Rec',
		'payPay': 'P',
		'priceUnavailable':'Precio nou disponível',
		'testOk': 'Teste ok',
		'insufficientFunds': 'Fundos insuficientes, pagamento não enviado',
		'invalidAmount': 'Valor inválido {0}',
		'notRegistered': 'Você não está registrado, digite `registre MeuNome` para abrir uma conta',
		'paymentFailed': 'Erro no pagamento',
		'destinationNotFound': 'Destinatário não encontrado',
		'paymentSent': 'Pagamento enviado',
		'paymentSentNotConfirmed': 'Pagamento enviado, aguardando confirmação...',
		'paymentConfirmed': 'Pagamento confirmado',
		'paymentReceived': 'Pagamento de {0} {1} recebido de {2}',
		'newTrustline': 'Agora você pode aceitar pagamentos em {0}',
		'allWord': 'todos',
		'buyWord': 'Compras',
		'sellWord': 'Vende',
		'noOpenOrders': 'Não há pedidos abertos',
		'ordersWord': 'Pedidos',

		// Errors
	    'error': 'Erro',
	    'errorNotFound': 'Informação não disponível',
	    'errorNoFunds': 'Fundos insuficientes',
	    'errorAccessingDatabase': 'Erro ao acessar o banco de dados, tente novamente mais tarde',
	    'errorFunding': 'Erro ao criar conta, tente novamente mais tarde',
	    'errorOpening': 'Erro ao abrir conta, tente novamente mais tarde',
	    'errorRegistering': 'Erro ao registrar conta, tente novamente mais tarde',
	    'errorSearching': 'Erro ao procurar conta, tente novamente mais tarde',
	    'errorAccessing': 'Erro ao acessar a conta, tente novamente mais tarde',
	    'errorRegisteringName': 'Erro ao registrar o nome, tente novamente mais tarde',
	    'errorContactingServer': 'Erro ao contatar o servidor, tente novamente mais tarde',
	    'errorServerUnavailable': 'Erro: Servidor indisponível, tente novamente mais tarde',
	    'errorLoadingHistory': 'Erro ao ler o extrato da conta',
	    'errorAccessingHistory': 'Erro ao acessar o extrato da conta',
	    'errorNoTrustline': 'Erro: O destinatário não pode aceitar {0}',
	    'errorSenderNoTrustline': 'Erro: O usuário não pode enviar {0}',
	    'errorInPayment': 'Erro de pagamento',
	    'errorInPaymentTry': 'Erro de pagamento, tente novamente mais tarde.',
	    'errorSendingPayment': 'Erro ao enviar o pagamento, tente novamente mais tarde',
	    'errorNoTrustSender': 'Erro: Ativo não aceito pela origem',
	    'errorNoTrustReceiver': 'Erro: Ativo não aceito pelo destino',
	    'errorExceedingLimit': 'Erro: Limite de ativos excedido',
	    'errorNotEnoughFunds': 'Fundos insuficientes, pagamento não enviado',
	    'errorInTrustline': 'Erro ao aceitar o ativo {0}',
	    'errorReadingOrders': 'Erro ao ler pedidos'
	}
}


function getLanguage(word){
	let lang = LANGUAGE[word]
	if(!lang) { lang = 'en' }
	return lang
}

function getVocabulary(lang){
	let voc = VOCABULARY[lang]
	if(!voc) { voc = VOCABULARY.en }
	return voc
}

function geLabelLang(label, lang){
	let text = VOCABULARY[label][lang]
	if(!text){ text = VOCABULARY[label].en }
	if(!text){ text = '[?]' }
	return text
}


exports.getLanguage   = getLanguage
exports.getVocabulary = getVocabulary

// END