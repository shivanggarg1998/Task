import React, {Component} from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import axios from 'axios';
import { clearErrors } from '../../actions/errorActions';

class ViewItem extends Component {

    constructor(props) {
        super(props);
        this.state = {
            items:null,
            item:null
        }
        this.handleBack=this.handleBack.bind(this);
    }

    componentDidMount(){
        if(this.props.isAuthenticated){
            const token = this.props.token;
  
            // Headers
            const config = {
                headers: {
                'Content-type': 'application/json'
                }
            };
    
            // If token, add to headers
            if (token) {
                config.headers['x-auth-seller-token'] = token;
            }
            axios.get('http://localhost:4000/seller/'+this.props.seller.id+'/viewItem', config)
                .then(response=>{
                    this.setState({
                        items:response.data
                    })
                })
                .catch(error=>{
                    console.log(error);
                })
          }
    }

      handleList(item){
          this.setState({
              item
          });
      }

      handleBack(){
          this.setState({
              item:null
          })
      }

    render() {
        return(
            <div>
            {
                this.state.item?(
                <div>
                   <button onClick={this.handleBack}>Go Back</button>
                   <h1> Item Details:</h1>
                   <h2> category: {this.state.item.cat_id.name}</h2> 
                   <h2> subcategory: {this.state.item.sub_cat_id.name}</h2>
                   <h2> quantity: {this.state.item.quantity}</h2>{this.state.item.sub_cat_id.quantity_type}
                   
                </div>
            ):(
                <div>
                <h1>Here are all the items for sale</h1>
                <ul>
                {
                    this.state.items? this.state.items.map(item=>{
                            return (<li key={item._id} onClick={()=>this.handleList(item)}>
                                category:{item.cat_id.name}  subcategory:{item.sub_cat_id.name}  quantity:{item.quantity}{item.sub_cat_id.quantity_type}
                            </li>)
                        }) : (<h1>No Items to display</h1>)
                    
                }
                </ul>
            </div>
            )
            }
            </div>
        )
    }
}

const mapStateToProps = state => ({
    token:state.sellerAuth.token,
    seller:state.sellerAuth.seller,
    isAuthenticated: state.sellerAuth.isAuthenticated,
    error: state.error
  });
  
  export default connect(
    mapStateToProps,
    { clearErrors }
  )(ViewItem);