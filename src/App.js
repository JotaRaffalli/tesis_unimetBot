import React, { Component } from 'react';
import './App.css';
import Conversation from './Conversation.js';
import DiscoveryResult from './DiscoveryResult.js';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      context: {},
      // A Message Object consists of a message[, intent, date, isUser]
      messageObjectList: [],
      discoveryNumber: 0
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.callWatson();
  }

  callWatson(message) {
    const watsonApiUrl = process.env.REACT_APP_API_URL;
    const requestJson = JSON.stringify({
      input: {
        text: message
      },
      context: this.state.context
    });
    return fetch(watsonApiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestJson
      }
    ).then((response) => {
      if(!response.ok) {
        throw response;
      }
      return(response.json());
    })
      .then((responseJson) => {
        responseJson.date = new Date();
        this.handleResponse(responseJson);
      }).catch(function(error) {
        throw error;
      });
  }

  handleResponse(responseJson) {
    if(responseJson.hasOwnProperty('output') && responseJson.output.hasOwnProperty('action') && responseJson.output.action.hasOwnProperty('call_discovery')) {
      if(responseJson.output.discoveryResults.lenght == 0){
        this.addMessage( { label: 'Resultado de Discovery:', message: 'Buena pregunta. Esto es lo que he econtrado:', date: (new Date()).toLocaleTimeString()});
        this.formatDiscovery(responseJson.output.discoveryResults);
      }
          else {
            this.addMessage({ message: "Ups! No he encontrado nada relacionado." });
          }
      
          this.setState({
            context: responseJson.context
          });
      console.log(responseJson);
            
    } else {
      console.log(responseJson);
      const outputMessage = responseJson.output.text.filter(text => text).join('\n');
      const outputIntent = responseJson.intents[0] ? responseJson.intents[0]['intent'] : '';
      const outputDate = responseJson.date.toLocaleTimeString();
      const outputContext = responseJson.context;
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
  }

  addMessage(msgObj) {
    this.setState({
      messageObjectList: [ ...this.state.messageObjectList , msgObj]
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
    this.addMessage(msgObj);
    e.target.value = '';
    this.callWatson(inputMessage);
  }

  formatDiscovery(resultArr) {
    
      resultArr.map(function(result, index) {
        const formattedResult = <DiscoveryResult key={'d' + this.state.discoveryNumber + index} title={result.title} preview={result.bodySnippet} link={result.sourceUrl} linkText={'See full manual entry'} />;
        this.addMessage({ message: formattedResult });
      }.bind(this));
          
      this.setState({
        discoveryNumber: this.state.discoveryNumber + 1
      });
      return(true);
    

  }

  scrollToBottom() {
    const element = document.getElementsByClassName('conversation__messages')[0];
    element.scrollTop = element.scrollHeight;
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }


  render() {
    return(
      <div className="app-wrapper">
        <p className="conversation__intro">
          Esta demostración muestra cómo el servicio Watson Assistant llama al servicio Discovery cuando no sabe cómo responder. Las llamadas a Watson Assistant y Discovery se realizan en OpenWhisk, la plataforma sin servidor de IBM.
        </p>
        <Conversation
          onSubmit={this.handleSubmit}
          messageObjectList={this.state.messageObjectList}
        />
      </div>
    );
  }
}

export default App;
