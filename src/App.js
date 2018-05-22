import React, { Component } from 'react';
import './App.css';
import Conversation from './Conversation.js';
import DiscoveryResult from './DiscoveryResult.js';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      context: {},
      user: null,
      // A Message Object consists of a message[, intent, date, isUser]
      messageObjectList: [],
      inputfield: "",
      discoveryNumber: 0
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateInput = this.updateInput.bind(this);
    this.callWatson();
  }

  callWatson(message) {
    //const watsonApiUrl = process.env.REACT_APP_API_URL;
    const middleWareUrl = "http://localhost:5000/botkit/receive"
    if (this.state.user == null) {
      let id = Math.floor((Math.random() * 10000) + 1)
      this.state.user = id
    }
    console.log("state", this.state)
    const requestJson = JSON.stringify(
      {
        text: message,
        user: this.state.user,
        channel: "webhook",
        context: this.state.context
      });

    console.log("request", requestJson)
    return fetch(middleWareUrl,
      {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin':'*'
        },
        body: requestJson,
      }
    ).then((response) => {
      if (!response.ok) {
        throw response;
      }
      return (response.json());
    })
      .then((responseJson) => {
        responseJson.date = new Date();
        console.log("Esta es la respuesta del middleware: ",responseJson);
        this.handleResponse(responseJson);
      }).catch(function (error) {
        throw error;
      });
  }

  handleResponse(responseJson) {
    if (responseJson.hasOwnProperty('watsonData') && responseJson.watsonData.hasOwnProperty('output')) {
      if (responseJson.watsonData.hasOwnProperty('output') 
      && responseJson.watsonData.output.hasOwnProperty('action') 
      && responseJson.watsonData.output.action.hasOwnProperty('call_discovery')) {
        if (responseJson.watsonData.output.discoveryResults.lenght == 0) {
          this.addMessage({ label: 'Resultado de Discovery:', message: 'Buena pregunta. Esto es lo que he econtrado:', date: (new Date()).toLocaleTimeString() });
          this.formatDiscovery(responseJson.watsonData.output.discoveryResults);
        }
        else {
          this.addMessage({ message: "Ups! No he encontrado nada relacionado." });
        }
        this.setState({
          context: responseJson.watsonData.context
        });
      } else {
        const outputMessage = responseJson.watsonData.output.text.filter(text => text).join('\n');
        const outputIntent = responseJson.watsonData.intents[0] ? responseJson.watsonData.intents[0]['intent'] : '';
        const outputDate = new Date().toLocaleDateString();
        const outputContext = responseJson.watsonData.context;
        this.setState({
          context: outputContext
        });
        const msgObj = {
          position: 'left',
          label: outputIntent,
          message: outputMessage,
          date: outputDate,
          hasTail: true
        };
        this.addMessage(msgObj);
      }
    } else {
      const outputDate = new Date().toLocaleDateString();
      const msgObj = {
        position: 'left',
        //label: outputIntent,
        message: responseJson.text,
        date: outputDate,
        hasTail: true
      };
      this.addMessage(msgObj);
    }
  }

  addMessage(msgObj) {
    this.setState({
      messageObjectList: [...this.state.messageObjectList, msgObj]
    });
  }

  handleSubmit(e) {
    const inputMessage = e.target.value;
    const inputDate = new Date();
    const formattedDate = inputDate.toLocaleTimeString();
    const msgObj = {
      position: 'right',
      message: inputMessage,
      date: formattedDate,
      hasTail: true
    };
    this.setState({ inputfield: "" })
    this.addMessage(msgObj);
    e.target.value = '';
    this.callWatson(inputMessage);
  }

  updateInput(e) {
    this.setState({ inputfield: e.target.value })
  }
  formatDiscovery(resultArr) {

    resultArr.map(function (result, index) {
      const formattedResult = <DiscoveryResult key={'d' + this.state.discoveryNumber + index} title={result.title} preview={result.bodySnippet} link={result.sourceUrl} linkText={'See full manual entry'} />;
      this.addMessage({ message: formattedResult });
    }.bind(this));

    this.setState({
      discoveryNumber: this.state.discoveryNumber + 1
    });
    return (true);


  }

  scrollToBottom() {
    const element = document.getElementsByClassName('conversation__messages')[0];
    element.scrollTop = element.scrollHeight;
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }


  render() {
    return (
      <div className="app-wrapper">
        <p className="conversation__intro">
          Esta interfáz gráfica sirve como demostración de que el sistema de atención al cliente
          realizado, puede ser fácilmente integrado a cualquier plataforma o aplicacción front-end que la
          Universidad desee, gracias a la modularidad del mismo para distribuir el servicio a distintos
          canales de información.
        </p>
        {/*     <p className="conversation__intro">
          El servicio esta configurado para activar el servicio Discovery cuando 
          el Asistente no sabe cómo responder. Las llamadas a Watson Assistant y 
          Discovery se realizan en OpenWhisk, la plataforma sin servidor o server-less de IBM.
        </p> */}
        <Conversation
          inputfield={this.state.inputfield}
          onSubmit={this.handleSubmit}
          onChange={this.updateInput}
          messageObjectList={this.state.messageObjectList}
        />
      </div>
    );
  }
}

export default App;
