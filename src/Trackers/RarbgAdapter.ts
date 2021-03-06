﻿var rarbgApi = require('rarbg-api')
import {ITorrentTrackerSearchResult, TorrentTrackerType, ITorrentInfo, ITorrentDownloadInfo, ITorrentTrackerAdapter, MovieSearchInfo } from "./Interfaces";

export class RarbgAdapter implements ITorrentTrackerAdapter {
	readonly Key: TorrentTrackerType = TorrentTrackerType.Rarbg;

	isRus() : boolean{ return false; }

	async download(id: ITorrentInfo): Promise<ITorrentDownloadInfo> {
		return {
			magnetLink: id.magnetLink
		}
	}

	async search(searchInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]> {	
		var searchOptions = {
			category: searchInfo.isTvShow ? rarbgApi.CATEGORY.TV : rarbgApi.CATEGORY.MOVIES_X264_1080P,
			limit: 25,
			sort: 'size',
			min_seeders: 1,
			min_leechers: null,
			format: 'json_extended',
			ranked: null
		  };	
		var torrents: Array<any> = await rarbgApi.search(searchInfo.toString("s", 2), searchOptions);		
		return torrents
			.map( (x) => {
				return {
					id: {type:TorrentTrackerType.Rarbg, magnetLink: x.download}, // todo: figure out how to get id
					state: null,
					category: x.category,
					title: x.title,
					sizeGb: Math.round((x.size / (1024 * 1024 * 1024)) * 10) /10,
					seeds: x.seeders,
					url: x.info_page,
					isHD: true // filter by category MOVIES_X264_1080P has been applied		
				};
			});
	}
}