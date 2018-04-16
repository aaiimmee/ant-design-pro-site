import React, { Children, cloneElement } from 'react';
import { Link,NavLink} from 'react-router-dom';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import DocumentTitle from 'react-document-title';
import { getChildren } from 'jsonml.js/lib/utils';
import { Timeline, Alert, Affix } from 'antd';
import delegate from 'delegate';
import EditButton from './EditButton';
import { ping } from '../utils';

export default class Article extends React.PureComponent {
  static contextTypes = {
    intl: PropTypes.object.isRequired,
  }
  componentDidMount() {
    // Add ga event click
    this.delegation = delegate(this.node, '.resource-card', 'click', (e) => {
      if (window.ga) {
        window.ga('send', 'event', 'Download', 'resource', e.delegateTarget.href);
      }
    }, false);
    this.componentDidUpdate();
  }
  componentDidUpdate() {
    const links = [...document.querySelectorAll('.outside-link.internal')];
    if (links.length === 0) {
      return;
    }
    this.pingTimer = ping((status) => {
      if (status !== 'timeout' && status !== 'error') {
        links.forEach(link => (link.style.display = 'block'));
      } else {
        links.forEach(link => link.parentNode.removeChild(link));
      }
    });
  }
  componentWillUnmount() {
    clearTimeout(this.pingTimer);
    if (this.delegation) {
      this.delegation.destroy();
    }
  }
  getArticle(article) {
    const { content } = this.props;
    const { meta } = content;

    if (!meta.timeline) {
      return article;
    }
    const timelineItems = [];
    let temp = [];
    let i = 1;
    Children.forEach(article.props.children, (child) => {
      if (child.type === 'h2' && temp.length > 0) {
        timelineItems.push(<Timeline.Item key={i}>{temp}</Timeline.Item>);
        temp = [];
        i += 1;
      }
      temp.push(child);

    });
    if (temp.length > 0) {
      timelineItems.push(<Timeline.Item key={i}>{temp}</Timeline.Item>);
    }
    return cloneElement(article, {
      children: <Timeline>{timelineItems}</Timeline>,
    });
  }

  getToc(){
    const props = this.props;
    const content = props.content;
    const Toc=content.toc;
    let TocItem=[];

    for(let i=1;i<Toc.length;i++){
      TocItem.push(<li key={i}>{Toc[i][1][2]}</li>);
    }

    return TocItem;
  }
  render() {
    const props = this.props;
    const content = props.content;
    /*console.log(content);*/
    const { meta, description } = content;
    const { title, subtitle, filename } = meta;
    const locale = this.context.intl.locale;
    const isNotTranslated = locale === 'en-US' && typeof title === 'object';

    return (
      <DocumentTitle title={props.content.meta.title}>
        {/*
      源代码：title={`${title[locale] || title} - Ant Design`}
                title={props.content.meta.title}  上下一样
      */}
        <article className="markdown" ref={(node) => { this.node = node; }}>
          {isNotTranslated && (
            <Alert
              type="warning"
              message={(
                <span>
                  This article has not been translated yet. Wan&apos;t to help us out? <a href="https://github.com/ant-design/ant-design-pro/issues/120">See this issue on GitHub.</a>
                </span>
              )}
              style={{ marginBottom: 24 }}
            />
          )}
          <h1>
            {title[locale] || title}
            {
              !subtitle || locale === 'en-US' ? null :
              <span className="subtitle">{subtitle}</span>
            }
            <EditButton
              title={<FormattedMessage id="app.content.edit-page" />}
              filename={
                filename.indexOf('scaffold/src/components') >= 0
                  ? 'xxx' : filename
              }
            />
          </h1>
          {
            !description ? null :
              props.utils.toReactComponent(
                ['section', { className: 'markdown' }].concat(getChildren(description))
              )
          }
          {
            (!content.toc || content.toc.length <= 1 || meta.toc === false) ? null :
            <Affix className="toc-affix" offsetTop={16}>
              {
                props.utils.toReactComponent(
                  ['ul', { className: 'toc' }].concat(getChildren(content.toc))
                )
              }
            </Affix>
          }
          <ul>
          {
            this.getToc()
          }
          </ul>
          {
            this.getArticle(props.utils.toReactComponent(
              ['section', { className: 'markdown' }].concat(getChildren(content.content))
            ))
          }
          {
            props.utils.toReactComponent(
              ['section', {
                className: 'markdown api-container',
              }].concat(getChildren(content.api || ['placeholder']))
            )
          }
        </article>
      </DocumentTitle>
    );
  }
}
